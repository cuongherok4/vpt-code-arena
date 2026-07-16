package com.vpt.arena.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.dto.learn.RunCodeRequest;
import com.vpt.arena.dto.learn.RunCodeResponse;
import com.vpt.arena.entity.Lesson;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.UserProgress;
import com.vpt.arena.repository.LessonRepository;
import com.vpt.arena.repository.UserProgressRepository;
import com.vpt.arena.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressService {

    private final UserProgressRepository userProgressRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;       // inject từ AppConfig bean
    private final ObjectMapper objectMapper;       // inject từ Spring auto-config

    @Value("${judge0.url}")
    private String judge0Url;
    @Value("${judge0.poll-interval-ms:250}")
    private long judge0PollIntervalMs;
    @Value("${judge0.timeout-ms:10000}")
    private long judge0TimeoutMs;
    @Value("${judge0.default-memory-limit-kb:256000}")
    private int judge0DefaultMemoryLimitKb;
    @Value("${judge0.java-memory-limit-kb:2048000}")
    private int judge0JavaMemoryLimitKb;
    @Value("${judge0.java-max-processes-and-threads:512}")
    private int judge0JavaMaxProcessesAndThreads;

    // ─── Mark lesson completed ────────────────────────────────────────────────

    @Transactional
    public void markCompleted(UUID userId, UUID lessonId) {
        Lesson lesson = findLesson(lessonId);
        User user = findUser(userId);

        UserProgress progress = userProgressRepository.findByUserIdAndLessonId(userId, lessonId)
            .orElseGet(() -> buildProgress(user, lesson));

        progress.setCompleted(true);
        progress.setCompletedAt(OffsetDateTime.now());
        userProgressRepository.save(progress);
    }

    // ─── Run code freely ──────────────────────────────────────────────────────

    public RunCodeResponse runCode(RunCodeRequest request, String expectedOutput) {
        Map<String, Object> body = new HashMap<>();
        body.put("source_code", encodeBase64(request.getSourceCode()));
        int languageId = request.getLanguageId() != null ? request.getLanguageId() : 62;
        body.put("language_id", languageId);
        if (expectedOutput != null) body.put("expected_output", encodeBase64(expectedOutput));
        body.put("base64_encoded", true);
        body.put("memory_limit", memoryLimitFor(languageId));
        body.put("enable_per_process_and_thread_time_limit", true);
        body.put("enable_per_process_and_thread_memory_limit", true);
        if (isJava(languageId)) {
            body.put("max_processes_and_or_threads", judge0JavaMaxProcessesAndThreads);
            body.put("compiler_options", "-J-Xmx256m -J-XX:MaxMetaspaceSize=256m -J-XX:+UseSerialGC -J-XX:ActiveProcessorCount=1");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            HttpEntity<String> httpEntity = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
            ResponseEntity<String> submitResponse = restTemplate.postForEntity(
                judge0Url + "/submissions?base64_encoded=true", httpEntity, String.class);
            String token = text(objectMapper.readTree(submitResponse.getBody()), "token");
            if (token == null || token.isBlank()) {
                throw new IllegalStateException("Judge0 did not return a submission token");
            }
            return pollSubmission(token, expectedOutput);
        } catch (RestClientException e) {
            log.error("Error calling Judge0 API. Is the service running? Message: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Judge0 service is unavailable. Please check the service logs.", e);
        } catch (JsonProcessingException e) {
            log.error("Error parsing Judge0 response: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to parse response from Judge0.", e);
        }
    }

    // ─── Submit challenge ─────────────────────────────────────────────────────

    @Transactional
    public RunCodeResponse submitChallenge(UUID userId, UUID lessonId, RunCodeRequest request) {
        Lesson lesson = findLesson(lessonId);

        RunCodeResponse failedCase = runChallengeTestCases(lesson, request);
        RunCodeResponse res = failedCase != null ? failedCase : runCode(request, extractFirstExpected(lesson));
        boolean allPassed = failedCase == null && Boolean.TRUE.equals(res.getPassed());

        if (allPassed && userId != null) {
            User user = findUser(userId);
            UserProgress progress = userProgressRepository.findByUserIdAndLessonId(userId, lessonId)
                .orElseGet(() -> buildProgress(user, lesson));
            progress.setChallengePassed(true);
            progress.setCompleted(true);
            progress.setCompletedAt(OffsetDateTime.now());
            userProgressRepository.save(progress);
        }

        return res;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Lesson findLesson(UUID id) {
        return lessonRepository.findByIdWithChapter(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
    }

    private User findUser(UUID id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserProgress buildProgress(User user, Lesson lesson) {
        UserProgress p = new UserProgress();
        p.setUser(user);
        p.setLesson(lesson);
        p.setChapter(lesson.getChapter());
        return p;
    }

    private String extractFirstExpected(Lesson lesson) {
        if (lesson.getChallengeTestCases() == null) return null;
        try {
            JsonNode cases = objectMapper.readTree(lesson.getChallengeTestCases()).get("cases");
            if (cases != null && cases.size() > 0) return cases.get(0).get("expected").asText();
        } catch (Exception e) {
            log.warn("Invalid test cases JSON for lesson {}: {}", lesson.getId(), e.getMessage());
        }
        return null;
    }

    /** Chạy tất cả test cases, trả về case fail đầu tiên nếu có. */
    private RunCodeResponse runChallengeTestCases(Lesson lesson, RunCodeRequest request) {
        if (lesson.getChallengeTestCases() == null) return null;
        try {
            JsonNode cases = objectMapper.readTree(lesson.getChallengeTestCases()).get("cases");
            if (cases == null || cases.isEmpty()) return null;
            for (JsonNode tc : cases) {
                String expected = tc.get("expected").asText();
                RunCodeResponse r = runCode(request, expected);
                if (!Boolean.TRUE.equals(r.getPassed())) return r;
            }
        } catch (Exception e) {
            log.warn("Error running test cases for lesson {}: {}", lesson.getId(), e.getMessage());
        }
        return null;
    }

    private String text(JsonNode root, String field) {
        return root.has(field) && !root.get(field).isNull() ? root.get(field).asText() : null;
    }

    private String encodeBase64(String value) {
        return Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private int memoryLimitFor(int languageId) {
        return isJava(languageId) ? judge0JavaMemoryLimitKb : judge0DefaultMemoryLimitKb;
    }

    private boolean isJava(int languageId) {
        return languageId == 62;
    }

    private String firstNonBlank(String primary, String fallback) {
        return primary != null && !primary.isBlank() ? primary : fallback;
    }

    private String decodeBase64(String value) {
        if (value == null || value.isBlank()) return value;
        try {
            byte[] decoded = Base64.getMimeDecoder().decode(value);
            return StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
                .decode(ByteBuffer.wrap(decoded))
                .toString();
        } catch (IllegalArgumentException | CharacterCodingException e) {
            return value;
        }
    }

    private RunCodeResponse pollSubmission(String token, String expectedOutput) throws JsonProcessingException {
        long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(judge0TimeoutMs);
        String url = judge0Url + "/submissions/" + token + "?base64_encoded=true&fields=stdout,stderr,compile_output,message,status,time,memory";

        while (System.nanoTime() < deadline) {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode statusNode = root.path("status");
            int statusId = statusNode.path("id").asInt(0);
            String statusDescription = statusNode.path("description").asText("");
            boolean finished = statusId > 2
                || (!statusDescription.isBlank()
                    && !"In Queue".equalsIgnoreCase(statusDescription)
                    && !"Processing".equalsIgnoreCase(statusDescription));

            if (finished) {
                RunCodeResponse res = RunCodeResponse.builder()
                    .stdout(decodeBase64(text(root, "stdout")))
                    .stderr(decodeBase64(text(root, "stderr")))
                    .compileOutput(decodeBase64(firstNonBlank(text(root, "compile_output"), text(root, "message"))))
                    .status(statusDescription.isBlank() ? "Unknown" : statusDescription)
                    .expectedOutput(expectedOutput)
                    .time(text(root, "time"))
                    .memory(root.has("memory") && !root.get("memory").isNull() ? root.get("memory").asText() : null)
                    .build();
                res.setPassed("Accepted".equalsIgnoreCase(res.getStatus()));
                return res;
            }

            try {
                Thread.sleep(judge0PollIntervalMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Interrupted while waiting for Judge0 result", e);
            }
        }

        throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT, "Judge0 did not finish in time");
    }
}
