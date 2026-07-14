package com.vpt.arena.service;

import com.fasterxml.jackson.databind.JsonNode;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

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
        body.put("source_code", request.getSourceCode());
        body.put("language_id", request.getLanguageId() != null ? request.getLanguageId() : 62);
        if (expectedOutput != null) body.put("expected_output", expectedOutput);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                judge0Url + "/submissions?base64_encoded=false&wait=true", body, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            RunCodeResponse res = RunCodeResponse.builder()
                .stdout(text(root, "stdout"))
                .stderr(text(root, "stderr"))
                .compileOutput(text(root, "compile_output"))
                .status(root.has("status") ? root.get("status").get("description").asText() : "Unknown")
                .time(text(root, "time"))
                .memory(root.has("memory") && !root.get("memory").isNull() ? root.get("memory").asText() : null)
                .build();

            res.setPassed("Accepted".equalsIgnoreCase(res.getStatus()));
            return res;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Judge0 error: " + e.getMessage());
        }
    }

    // ─── Submit challenge ─────────────────────────────────────────────────────

    @Transactional
    public RunCodeResponse submitChallenge(UUID userId, UUID lessonId, RunCodeRequest request) {
        Lesson lesson = findLesson(lessonId);

        // Chạy tất cả test cases — fail bất kỳ 1 case → passed = false
        boolean allPassed = runAllTestCases(lesson, request);
        RunCodeResponse res = runCode(request, extractFirstExpected(lesson));
        res.setPassed(allPassed);

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

    /** Chạy tất cả test cases, trả false nếu bất kỳ case nào fail. */
    private boolean runAllTestCases(Lesson lesson, RunCodeRequest request) {
        if (lesson.getChallengeTestCases() == null) return true;
        try {
            JsonNode cases = objectMapper.readTree(lesson.getChallengeTestCases()).get("cases");
            if (cases == null || cases.isEmpty()) return true;
            for (JsonNode tc : cases) {
                String expected = tc.get("expected").asText();
                RunCodeResponse r = runCode(request, expected);
                if (!Boolean.TRUE.equals(r.getPassed())) return false;
            }
        } catch (Exception e) {
            log.warn("Error running test cases for lesson {}: {}", lesson.getId(), e.getMessage());
        }
        return true;
    }

    private String text(JsonNode root, String field) {
        return root.has(field) && !root.get(field).isNull() ? root.get(field).asText() : null;
    }
}
