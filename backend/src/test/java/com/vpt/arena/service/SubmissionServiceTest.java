package com.vpt.arena.service;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SubmissionService Unit Tests")
class SubmissionServiceTest {

    @Mock private SubmissionRepository submissionRepository;
    @Mock private ProblemRepository problemRepository;
    @Mock private UserRepository userRepository;
    @Mock private RestTemplate restTemplate;
    @Mock private LeaderboardService leaderboardService;

    @InjectMocks
    private SubmissionService submissionService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(submissionService, "objectMapper", new ObjectMapper());
        ReflectionTestUtils.setField(submissionService, "judge0Url", "http://localhost:2358");
        ReflectionTestUtils.setField(submissionService, "judge0PollIntervalMs", 1L);
        ReflectionTestUtils.setField(submissionService, "judge0TimeoutMs", 1000L);
        ReflectionTestUtils.setField(submissionService, "judge0DefaultMemoryLimitKb", 256000);
        ReflectionTestUtils.setField(submissionService, "judge0JavaMemoryLimitKb", 2048000);
        ReflectionTestUtils.setField(submissionService, "judge0JavaMaxProcessesAndThreads", 512);
    }

    private ExamSubmitRequest request(String language) {
        ExamSubmitRequest request = new ExamSubmitRequest();
        request.setSourceCode("print('ok')");
        request.setLanguage(language);
        return request;
    }

    private User user(UUID id) {
        User user = new User();
        user.setId(id);
        user.setEmail("u@test.com");
        user.setName("Tester");
        return user;
    }

    private Problem problem(UUID id, boolean published) {
        Problem problem = new Problem();
        problem.setId(id);
        problem.setTitle("Sum");
        problem.setDescription("Sum two numbers");
        problem.setDifficulty(Difficulty.EASY);
        problem.setTopic("math");
        problem.setPublished(published);
        problem.setTestCases("{\"cases\":[{\"input\":\"1 2\\n\",\"expected\":\"3\\n\"}]}");
        return problem;
    }

    @Nested
    @DisplayName("submit")
    class Submit {
        @Test
        @DisplayName("Tạo submission PENDING và normalize language")
        void shouldCreatePendingSubmission() {
            UUID userId = UUID.randomUUID();
            UUID problemId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.of(user(userId)));
            when(problemRepository.findById(problemId)).thenReturn(Optional.of(problem(problemId, true)));
            when(submissionRepository.save(any(Submission.class))).thenAnswer(invocation -> {
                Submission submission = invocation.getArgument(0);
                submission.setId(UUID.randomUUID());
                return submission;
            });

            SubmissionDto dto = submissionService.submit(userId, problemId, request("Python"));

            assertThat(dto.getResult()).isEqualTo(JudgeResult.PENDING);
            assertThat(dto.getLanguage()).isEqualTo("python");
            assertThat(dto.getPoints()).isZero();
        }

        @Test
        @DisplayName("Reject unsupported language trước khi lưu DB")
        void shouldRejectUnsupportedLanguageBeforeSave() {
            assertThatThrownBy(() -> submissionService.submit(UUID.randomUUID(), UUID.randomUUID(), request("javascript")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Unsupported language");

            verify(submissionRepository, never()).save(any());
        }

        @Test
        @DisplayName("Ẩn problem chưa publish")
        void shouldRejectUnpublishedProblem() {
            UUID userId = UUID.randomUUID();
            UUID problemId = UUID.randomUUID();
            when(userRepository.findById(userId)).thenReturn(Optional.of(user(userId)));
            when(problemRepository.findById(problemId)).thenReturn(Optional.of(problem(problemId, false)));

            assertThatThrownBy(() -> submissionService.submit(userId, problemId, request("c")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Problem not found");
        }
    }

    @Test
    @DisplayName("Apply judge result cập nhật submission")
    void shouldApplyJudgeResult() {
        UUID submissionId = UUID.randomUUID();
        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setProblem(problem(UUID.randomUUID(), true));
        submission.setLanguage("python");
        submission.setResult(JudgeResult.PENDING);
        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));
        when(submissionRepository.save(any(Submission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        JudgeResultRequest request = new JudgeResultRequest();
        request.setSubmissionId(submissionId);
        request.setResult(JudgeResult.AC);
        request.setPoints(100);
        request.setExecutionTime(10);
        request.setMemoryUsed(2048);

        SubmissionDto dto = submissionService.applyJudgeResult(request);

        assertThat(dto.getResult()).isEqualTo(JudgeResult.AC);
        assertThat(dto.getPoints()).isEqualTo(100);
        assertThat(dto.getExecutionTime()).isEqualTo(10);
        assertThat(dto.getMemoryUsed()).isEqualTo(2048);
        verify(leaderboardService).evictExamLeaderboard(submission.getProblem().getId());
    }
}
