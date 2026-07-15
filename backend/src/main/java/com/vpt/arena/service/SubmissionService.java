package com.vpt.arena.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.dto.exam.ExamSubmitRequest;
import com.vpt.arena.dto.exam.JudgeResultRequest;
import com.vpt.arena.dto.exam.SubmissionDto;
import com.vpt.arena.entity.Problem;
import com.vpt.arena.entity.Submission;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.Difficulty;
import com.vpt.arena.entity.enums.JudgeResult;
import com.vpt.arena.repository.ProblemRepository;
import com.vpt.arena.repository.SubmissionRepository;
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
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

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

    @Transactional
    public SubmissionDto submit(UUID userId, UUID problemId, ExamSubmitRequest request) {
        String language = normalizeLanguage(request.getLanguage());
        languageIdFor(language);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Problem problem = problemRepository.findById(problemId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));
        if (!problem.isPublished()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found");
        }

        Submission submission = new Submission();
        submission.setUser(user);
        submission.setProblem(problem);
        submission.setCode(request.getSourceCode());
        submission.setLanguage(language);
        submission.setResult(JudgeResult.PENDING);
        submission.setPoints(0);
        submission = submissionRepository.save(submission);

        return toDto(submission);
    }

    public List<SubmissionDto> history(UUID userId, UUID problemId) {
        return submissionRepository.findTop20ByUserIdAndProblemIdOrderBySubmittedAtDesc(userId, problemId)
            .stream()
            .map(this::toDto)
            .toList();
    }

    public void judgeSubmission(UUID submissionId) {
        Submission submission = submissionRepository.findByIdWithProblem(submissionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
        JudgeOutcome outcome = judge(submission);
        applyJudgeResult(submissionId, outcome.result(), outcome.points(), outcome.executionTime(), outcome.memoryUsed(), outcome.errorOutput());
    }

    @Transactional
    public SubmissionDto applyJudgeResult(JudgeResultRequest request) {
        return applyJudgeResult(
            request.getSubmissionId(),
            request.getResult(),
            request.getPoints() == null ? 0 : request.getPoints(),
            request.getExecutionTime(),
            request.getMemoryUsed(),
            request.getErrorOutput()
        );
    }

    @Transactional
    public SubmissionDto markJudgeFailure(UUID submissionId, String message) {
        return applyJudgeResult(submissionId, JudgeResult.RE, 0, null, null, firstNonBlank(message, "Judge failed"));
    }

    @Transactional
    public SubmissionDto applyJudgeResult(UUID submissionId, JudgeResult result, int points, Integer executionTime, Integer memoryUsed, String errorOutput) {
        Submission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
        submission.setResult(result);
        submission.setPoints(Math.max(points, 0));
        submission.setExecutionTime(executionTime);
        submission.setMemoryUsed(memoryUsed);
        submission.setErrorOutput(errorOutput);
        return toDto(submissionRepository.save(submission));
    }

    private JudgeOutcome judge(Submission submission) {
        Problem problem = submission.getProblem();
        int languageId = languageIdFor(submission.getLanguage());
        try {
            JsonNode cases = objectMapper.readTree(problem.getTestCases()).path("cases");
            if (!cases.isArray() || cases.isEmpty()) {
                return new JudgeOutcome(JudgeResult.RE, 0, null, null, "Problem has no test cases");
            }

            Integer maxTimeMs = null;
            Integer maxMemoryKb = null;
            for (JsonNode testCase : cases) {
                Judge0Result result = runJudge0(
                    submission.getCode(),
                    languageId,
                    testCase.path("input").asText(""),
                    testCase.path("expected").asText(""),
                    problem.getTimeLimitMs(),
                    problem.getMemoryLimitKb()
                );
                maxTimeMs = max(maxTimeMs, result.executionTimeMs());
                maxMemoryKb = max(maxMemoryKb, result.memoryKb());

                JudgeResult mapped = mapStatus(result.status());
                if (mapped != JudgeResult.AC) {
                    return new JudgeOutcome(mapped, 0, maxTimeMs, maxMemoryKb, result.errorOutput());
                }
            }

            return new JudgeOutcome(JudgeResult.AC, pointsFor(problem.getDifficulty()), maxTimeMs, maxMemoryKb, null);
        } catch (JsonProcessingException e) {
            return new JudgeOutcome(JudgeResult.RE, 0, null, null, "Invalid problem test cases");
        } catch (RestClientException e) {
            return new JudgeOutcome(JudgeResult.RE, 0, null, null, "Judge0 service is unavailable");
        }
    }

    private Judge0Result runJudge0(String sourceCode, int languageId, String stdin, String expectedOutput, int timeLimitMs, int memoryLimitKb) throws JsonProcessingException {
        Map<String, Object> body = new HashMap<>();
        body.put("source_code", encodeBase64(sourceCode));
        body.put("language_id", languageId);
        body.put("stdin", encodeBase64(stdin));
        body.put("expected_output", encodeBase64(expectedOutput));
        body.put("base64_encoded", true);
        body.put("cpu_time_limit", Math.max(1, (int) Math.ceil(timeLimitMs / 1000.0)));
        body.put("wall_time_limit", Math.max(2, (int) Math.ceil(timeLimitMs / 1000.0) + 1));
        body.put("memory_limit", isJava(languageId) ? judge0JavaMemoryLimitKb : memoryLimitKb);
        body.put("enable_per_process_and_thread_time_limit", true);
        body.put("enable_per_process_and_thread_memory_limit", true);
        if (isJava(languageId)) {
            body.put("max_processes_and_or_threads", judge0JavaMaxProcessesAndThreads);
            body.put("compiler_options", "-J-Xmx256m -J-XX:MaxMetaspaceSize=256m -J-XX:+UseSerialGC -J-XX:ActiveProcessorCount=1");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<String> submitResponse = restTemplate.postForEntity(
            judge0Url + "/submissions?base64_encoded=true",
            new HttpEntity<>(objectMapper.writeValueAsString(body), headers),
            String.class
        );
        String token = text(objectMapper.readTree(submitResponse.getBody()), "token");
        if (token == null || token.isBlank()) {
            throw new IllegalStateException("Judge0 did not return a submission token");
        }
        return pollSubmission(token);
    }

    private Judge0Result pollSubmission(String token) throws JsonProcessingException {
        long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(judge0TimeoutMs);
        String url = judge0Url + "/submissions/" + token + "?base64_encoded=true&fields=stdout,stderr,compile_output,message,status,time,memory";

        while (System.nanoTime() < deadline) {
            JsonNode root = objectMapper.readTree(restTemplate.getForEntity(url, String.class).getBody());
            JsonNode statusNode = root.path("status");
            int statusId = statusNode.path("id").asInt(0);
            String status = statusNode.path("description").asText("");
            boolean finished = statusId > 2
                || (!status.isBlank() && !"In Queue".equalsIgnoreCase(status) && !"Processing".equalsIgnoreCase(status));

            if (finished) {
                return new Judge0Result(
                    status.isBlank() ? "Unknown" : status,
                    parseTimeMs(text(root, "time")),
                    parseInteger(text(root, "memory")),
                    firstNonBlank(
                        decodeBase64(firstNonBlank(text(root, "compile_output"), text(root, "message"))),
                        decodeBase64(text(root, "stderr"))
                    )
                );
            }

            sleep();
        }

        return new Judge0Result("Time Limit Exceeded", null, null, "Judge0 did not finish in time");
    }

    private SubmissionDto toDto(Submission submission) {
        return SubmissionDto.builder()
            .id(submission.getId())
            .problemId(submission.getProblem().getId())
            .language(submission.getLanguage())
            .result(submission.getResult())
            .points(submission.getPoints())
            .executionTime(submission.getExecutionTime())
            .memoryUsed(submission.getMemoryUsed())
            .errorOutput(submission.getErrorOutput())
            .submittedAt(submission.getSubmittedAt())
            .build();
    }

    private String normalizeLanguage(String language) {
        return language.trim().toLowerCase(Locale.ROOT);
    }

    private int languageIdFor(String language) {
        return switch (normalizeLanguage(language)) {
            case "c" -> 50;
            case "python", "python3" -> 71;
            case "java" -> 62;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported language");
        };
    }

    private int pointsFor(Difficulty difficulty) {
        return switch (difficulty) {
            case EASY -> 100;
            case MEDIUM -> 200;
            case HARD -> 300;
        };
    }

    private JudgeResult mapStatus(String status) {
        if ("Accepted".equalsIgnoreCase(status)) return JudgeResult.AC;
        if ("Wrong Answer".equalsIgnoreCase(status)) return JudgeResult.WA;
        if ("Time Limit Exceeded".equalsIgnoreCase(status)) return JudgeResult.TLE;
        if ("Compilation Error".equalsIgnoreCase(status)) return JudgeResult.CE;
        return JudgeResult.RE;
    }

    private boolean isJava(int languageId) {
        return languageId == 62;
    }

    private Integer max(Integer current, Integer next) {
        if (next == null) return current;
        return current == null ? next : Math.max(current, next);
    }

    private Integer parseInteger(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer parseTimeMs(String seconds) {
        if (seconds == null || seconds.isBlank()) return null;
        try {
            return (int) Math.ceil(Double.parseDouble(seconds) * 1000);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void sleep() {
        try {
            Thread.sleep(judge0PollIntervalMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Interrupted while waiting for Judge0 result", e);
        }
    }

    private String text(JsonNode root, String field) {
        return root.has(field) && !root.get(field).isNull() ? root.get(field).asText() : null;
    }

    private String encodeBase64(String value) {
        return Base64.getEncoder().encodeToString((value == null ? "" : value).getBytes(StandardCharsets.UTF_8));
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

    private record Judge0Result(String status, Integer executionTimeMs, Integer memoryKb, String errorOutput) {}

    private record JudgeOutcome(JudgeResult result, int points, Integer executionTime, Integer memoryUsed, String errorOutput) {}
}
