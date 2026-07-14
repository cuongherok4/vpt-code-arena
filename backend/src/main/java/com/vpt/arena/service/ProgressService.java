package com.vpt.arena.service;

import com.vpt.arena.dto.learn.RunCodeRequest;
import com.vpt.arena.dto.learn.RunCodeResponse;
import com.vpt.arena.entity.Lesson;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.UserProgress;
import com.vpt.arena.repository.LessonRepository;
import com.vpt.arena.repository.UserProgressRepository;
import com.vpt.arena.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.ResponseEntity;

import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final UserProgressRepository userProgressRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public void markCompleted(UUID userId, UUID lessonId) {
        if (userId == null) return;
        Lesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        UserProgress progress = userProgressRepository.findByUserIdAndLessonId(userId, lessonId)
            .orElseGet(() -> {
                UserProgress p = new UserProgress();
                p.setUser(user);
                p.setLesson(lesson);
                p.setChapter(lesson.getChapter());
                return p;
            });
            
        progress.setCompleted(true);
        progress.setCompletedAt(OffsetDateTime.now());
        userProgressRepository.save(progress);
    }

    public RunCodeResponse runCode(RunCodeRequest request, String expectedOutput) {
        Map<String, Object> body = new HashMap<>();
        body.put("source_code", request.getSourceCode());
        body.put("language_id", request.getLanguageId() != null ? request.getLanguageId() : 62); // Default Java 62
        if (expectedOutput != null) {
            body.put("expected_output", expectedOutput);
        }

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                "http://localhost:2358/submissions?base64_encoded=false&wait=true", 
                body, String.class);
                
            JsonNode root = objectMapper.readTree(response.getBody());
            RunCodeResponse res = RunCodeResponse.builder()
                .stdout(root.has("stdout") && !root.get("stdout").isNull() ? root.get("stdout").asText() : null)
                .stderr(root.has("stderr") && !root.get("stderr").isNull() ? root.get("stderr").asText() : null)
                .compileOutput(root.has("compile_output") && !root.get("compile_output").isNull() ? root.get("compile_output").asText() : null)
                .status(root.has("status") ? root.get("status").get("description").asText() : "Unknown")
                .build();
                
            res.setPassed("Accepted".equalsIgnoreCase(res.getStatus()));
            return res;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Judge0 error: " + e.getMessage());
        }
    }

    @Transactional
    public RunCodeResponse submitChallenge(UUID userId, UUID lessonId, RunCodeRequest request) {
        Lesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
        
        String expected = null;
        try {
            if (lesson.getChallengeTestCases() != null) {
                JsonNode cases = objectMapper.readTree(lesson.getChallengeTestCases()).get("cases");
                if (cases != null && cases.size() > 0) {
                    expected = cases.get(0).get("expected").asText();
                }
            }
        } catch (Exception ignored) {}

        RunCodeResponse res = runCode(request, expected);
        
        if (Boolean.TRUE.equals(res.getPassed()) && userId != null) {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            UserProgress progress = userProgressRepository.findByUserIdAndLessonId(userId, lessonId)
                .orElseGet(() -> {
                    UserProgress p = new UserProgress();
                    p.setUser(user);
                    p.setLesson(lesson);
                    p.setChapter(lesson.getChapter());
                    return p;
                });
            progress.setChallengePassed(true);
            progress.setCompleted(true);
            progress.setCompletedAt(OffsetDateTime.now());
            userProgressRepository.save(progress);
        }
        
        return res;
    }
}
