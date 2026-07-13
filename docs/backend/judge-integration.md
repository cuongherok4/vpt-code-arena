# Judge Integration — Judge0 Self-Hosted

> **Judge Service**: Node.js 20 + TypeScript — microservice tách biệt tại `judge-service/`
> **Engine**: Judge0 CE (Community Edition) chạy Docker
> **Queue**: Bull (Redis-backed) — xử lý submission async, không block API

---

## 1. Kiến trúc tổng quan

```
[Spring Boot]                  [Judge Service]              [Judge0 Docker]
      │                               │                            │
      │──POST /submit ────────────────►│                            │
      │  {submissionId, code, lang,   │── enqueue vào Bull queue   │
      │   problemId, type}            │                            │
      │◄─ 202 {submissionId:PENDING}  │                            │
      │                               │── [Bull Worker process] ──►│
      │                               │   POST /submissions (Judge0)│
      │                               │◄─ token ───────────────────│
      │                               │── GET /submissions/{token}  │
      │                               │   (polling đến khi xong)   │
      │                               │◄─ result {status, output}  │
      │◄─ POST /internal/judge-result ─│                            │
      │   {submissionId, result,      │                            │
      │    executionTime, output}     │                            │
      │── update DB + notify WS       │                            │
```

---

## 2. Judge0 Setup (Docker)

### docker-compose.dev.yml — Judge0 Services

```yaml
# Judge0 cần 3 containers: server, workers, database
judge0-server:
  image: judge0/judge0:1.13.1
  volumes:
    - ./judge0.conf:/judge0.conf:ro
  ports:
    - "2358:2358"
  privileged: true
  restart: always
  environment:
    - REDIS_URL=redis://redis:6379/1
    - DATABASE_URL=postgres://judge0:judge0@postgres:5432/judge0

judge0-workers:
  image: judge0/judge0:1.13.1
  command: ["./scripts/workers"]
  volumes:
    - ./judge0.conf:/judge0.conf:ro
  privileged: true
  restart: always
  environment:
    - REDIS_URL=redis://redis:6379/1
    - DATABASE_URL=postgres://judge0:judge0@postgres:5432/judge0
```

### judge0.conf — Cấu hình tối thiểu

```ini
# Thời gian tối đa (giây) cho mỗi submission
MAX_CPU_TIME_LIMIT=10
MAX_REAL_TIME_LIMIT=15
MAX_MEMORY_LIMIT=512000    # KB = 512 MB

# Bảo mật sandbox
ENABLE_NETWORK=false        # QUAN TRỌNG: tắt network trong sandbox
```

---

## 3. Language IDs (Judge0)

| Ngôn ngữ | Judge0 Language ID |
|---|---|
| Java (OpenJDK 21) | 62 |
| Python 3 (3.12) | 71 |
| C++ (GCC 14) | 105 |
| JavaScript (Node.js 18) | 93 |

```typescript
// judge-service/src/judge/languageMap.ts
export const LANGUAGE_MAP: Record<string, number> = {
  java:       62,
  python:     71,
  cpp:        105,
  javascript: 93,
};
```

---

## 4. Judge Service — Code chính

### submissionQueue.ts — Bull Queue

```typescript
// judge-service/src/queue/submissionQueue.ts
import Queue from 'bull';
import { judge0Client } from '../judge/judge0Client';

export interface SubmissionJob {
  submissionId: string;
  type: 'EXAM' | 'BATTLE' | 'LEARN';
  problemId: string;
  code: string;
  language: string;
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
  timeLimit: number;   // ms
  memoryLimit: number; // MB
}

const submissionQueue = new Queue<SubmissionJob>('submissions', {
  redis: process.env.REDIS_URL,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    timeout: 60_000,  // 60s timeout per job
  },
});

submissionQueue.process(5, async (job) => {  // 5 workers song song
  const { submissionId, code, language, testCases, timeLimit, memoryLimit } = job.data;

  const langId = LANGUAGE_MAP[language];
  if (!langId) throw new Error(`Unsupported language: ${language}`);

  let finalResult: JudgeResult = 'AC';
  let executionTime = 0;
  let memoryUsed = 0;
  let errorOutput = '';

  // Chạy qua từng test case
  for (const testCase of testCases) {
    const result = await runSingleTestCase({
      code, langId, testCase, timeLimit, memoryLimit
    });

    executionTime = Math.max(executionTime, result.time * 1000);  // ms
    memoryUsed = Math.max(memoryUsed, result.memory);

    if (result.status.id !== 3) {  // 3 = Accepted
      finalResult = mapStatus(result.status.id);
      errorOutput = result.stderr || result.compile_output || '';
      break;  // Fail fast
    }
  }

  // Callback về Spring Boot
  await notifyMainApi(submissionId, {
    result: finalResult,
    executionTime,
    memoryUsed,
    errorOutput,
    points: finalResult === 'AC' ? calculatePoints(job.data) : 0,
  });
});

export { submissionQueue };
```

### judge0Client.ts — Gọi Judge0 API

```typescript
// judge-service/src/judge/judge0Client.ts
import axios from 'axios';

const judge0 = axios.create({
  baseURL: process.env.JUDGE0_URL,  // http://localhost:2358
  headers: process.env.JUDGE0_AUTH_TOKEN
    ? { 'X-Auth-Token': process.env.JUDGE0_AUTH_TOKEN }
    : {},
});

export async function runSingleTestCase(params: {
  code: string;
  langId: number;
  testCase: { input: string; expectedOutput: string };
  timeLimit: number;
  memoryLimit: number;
}) {
  // Bước 1: Submit
  const { data: { token } } = await judge0.post('/submissions', {
    source_code:     Buffer.from(params.code).toString('base64'),
    language_id:     params.langId,
    stdin:           Buffer.from(params.testCase.input).toString('base64'),
    expected_output: Buffer.from(params.testCase.expectedOutput).toString('base64'),
    cpu_time_limit:  params.timeLimit / 1000,          // Judge0 dùng giây
    memory_limit:    params.memoryLimit * 1024,         // Judge0 dùng KB
    base64_encoded:  true,
  });

  // Bước 2: Poll kết quả (retry tối đa 10 lần, mỗi 500ms)
  for (let i = 0; i < 10; i++) {
    await sleep(500);
    const { data } = await judge0.get(`/submissions/${token}`, {
      params: { base64_encoded: true, fields: 'status,time,memory,stderr,compile_output' }
    });

    if (data.status.id > 2) {  // > 2 = không còn PENDING/PROCESSING
      return {
        ...data,
        stderr:          data.stderr          ? atob(data.stderr)          : null,
        compile_output:  data.compile_output  ? atob(data.compile_output)  : null,
      };
    }
  }

  throw new Error('Judge0 timeout: no result after 5 seconds');
}
```

### Mapping Judge0 Status

```typescript
// Judge0 status IDs
function mapStatus(statusId: number): JudgeResult {
  switch (statusId) {
    case 3:  return 'AC';    // Accepted
    case 4:  return 'WA';    // Wrong Answer
    case 5:  return 'TLE';   // Time Limit Exceeded
    case 6:  return 'CE';    // Compilation Error
    case 7:  case 8: case 9: case 10: case 11: case 12:
             return 'RE';    // Runtime Error (various)
    default: return 'WA';
  }
}
```

---

## 5. Spring Boot — Gửi submission tới Judge Service

```java
// JudgeService.java trong Spring Boot
@Service
@RequiredArgsConstructor
public class JudgeService {

    private final RestTemplate restTemplate;

    @Value("${judge.service.url}")
    private String judgeServiceUrl;

    public void submitToJudge(SubmitToJudgeRequest request) {
        // Async — không chờ kết quả
        CompletableFuture.runAsync(() -> {
            try {
                restTemplate.postForObject(
                    judgeServiceUrl + "/submit",
                    request,
                    Void.class
                );
            } catch (Exception e) {
                log.error("Failed to send to judge service: {}", e.getMessage());
                // TODO: retry logic hoặc dead letter queue
            }
        });
    }
}
```

---

## 6. Spring Boot — Nhận callback từ Judge Service

```java
// JudgeCallbackController.java — Internal endpoint, không expose ra ngoài
@RestController
@RequestMapping("/internal")
public class JudgeCallbackController {

    @PostMapping("/judge-result")
    public ResponseEntity<Void> receiveResult(
        @RequestBody JudgeResultCallback callback,
        @RequestHeader("X-Internal-Secret") String secret
    ) {
        // Verify internal secret để tránh bị gọi từ bên ngoài
        if (!internalSecret.equals(secret)) {
            return ResponseEntity.status(403).build();
        }

        judgeCallbackService.processResult(callback);
        return ResponseEntity.ok().build();
    }
}

// JudgeCallbackService.java
@Service
@Transactional
public class JudgeCallbackService {

    public void processResult(JudgeResultCallback callback) {
        if (callback.type() == SubmissionType.EXAM) {
            Submission submission = submissionRepository.findById(callback.submissionId())
                .orElseThrow();
            submission.setResult(callback.result());
            submission.setPoints(callback.points());
            submission.setExecutionTime(callback.executionTime());
            submission.setMemoryUsed(callback.memoryUsed());
            submissionRepository.save(submission);

            // Invalidate leaderboard cache
            redisService.deleteLeaderboardCache(submission.getProblemId(), submission.getLanguage());

        } else if (callback.type() == SubmissionType.BATTLE) {
            BattleSubmission bs = battleSubmissionRepository.findById(callback.submissionId())
                .orElseThrow();
            bs.setResult(callback.result());
            bs.setPoints(callback.points());
            battleSubmissionRepository.save(bs);

            // Tính leaderboard mới và broadcast qua WebSocket Service
            List<LeaderboardRow> leaderboard = calcBattleLeaderboard(bs.getRoomId());
            websocketNotifier.broadcastLeaderboard(bs.getRoomId(), leaderboard);
        }
    }
}
```

---

## 7. Mini Code Runner (Learn Module)

> Learn module chỉ cần **show output**, không cần chấm test case. Dùng Judge0 đơn giản hơn.

```java
// LearnController.java
@PostMapping("/learn/run-code")
public RunCodeResponse runCode(@RequestBody RunCodeRequest request,
                               @AuthenticationPrincipal CustomUserDetails user) {
    // Gọi trực tiếp Judge0 qua Judge Service (không cần queue, sync là được)
    return judgeService.runCodeDirectly(request.code(), request.language());
}
```

```typescript
// Judge Service — route riêng cho run-code (sync, không queue)
app.post('/run', async (req, res) => {
  const { code, language } = req.body;
  const result = await judge0Client.runCode(code, LANGUAGE_MAP[language]);
  res.json({ output: result.stdout, error: result.stderr, executionTimeMs: result.time * 1000 });
});
```

---

## 8. Bảo mật sandbox

| Bảo mật | Cấu hình |
|---|---|
| Network disabled | `ENABLE_NETWORK=false` trong judge0.conf |
| File system isolation | Docker container ephemeral, không persist |
| CPU time limit | Cấu hình per-submission (không vượt quá `MAX_CPU_TIME_LIMIT`) |
| Memory limit | Per-submission, mặc định 256 MB |
| No system calls | Judge0 dùng `isolate` sandbox |
