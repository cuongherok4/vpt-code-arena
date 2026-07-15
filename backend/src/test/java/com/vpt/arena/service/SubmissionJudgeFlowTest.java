package com.vpt.arena.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.entity.Problem;
import com.vpt.arena.entity.Submission;
import com.vpt.arena.entity.enums.Difficulty;
import com.vpt.arena.entity.enums.JudgeResult;
import com.vpt.arena.repository.ProblemRepository;
import com.vpt.arena.repository.SubmissionRepository;
import com.vpt.arena.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@ExtendWith(MockitoExtension.class)
@DisplayName("Submission judge flow integration tests")
class SubmissionJudgeFlowTest {

    @Mock private SubmissionRepository submissionRepository;
    @Mock private ProblemRepository problemRepository;
    @Mock private UserRepository userRepository;
    @Mock private LeaderboardService leaderboardService;

    private SubmissionService submissionService;
    private MockRestServiceServer judge0;

    @BeforeEach
    void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        judge0 = MockRestServiceServer.bindTo(restTemplate).build();
        submissionService = new SubmissionService(
            submissionRepository,
            problemRepository,
            userRepository,
            restTemplate,
            new ObjectMapper(),
            leaderboardService
        );
        ReflectionTestUtils.setField(submissionService, "judge0Url", "http://judge0.test");
        ReflectionTestUtils.setField(submissionService, "judge0PollIntervalMs", 1L);
        ReflectionTestUtils.setField(submissionService, "judge0TimeoutMs", 1000L);
        ReflectionTestUtils.setField(submissionService, "judge0DefaultMemoryLimitKb", 256000);
        ReflectionTestUtils.setField(submissionService, "judge0JavaMemoryLimitKb", 2048000);
        ReflectionTestUtils.setField(submissionService, "judge0JavaMaxProcessesAndThreads", 512);
    }

    @Test
    @DisplayName("Judge0 mock trả Accepted thì cập nhật submission AC")
    void shouldJudgeAcceptedSubmissionEndToEndWithMockJudge() {
        UUID submissionId = UUID.randomUUID();
        UUID problemId = UUID.randomUUID();
        Submission submission = submission(submissionId, problem(problemId));

        when(submissionRepository.findByIdWithProblem(submissionId)).thenReturn(Optional.of(submission));
        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));
        when(submissionRepository.save(any(Submission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        expectAcceptedCase("token-1", "0.001", 1024);
        expectAcceptedCase("token-2", "0.002", 2048);

        submissionService.judgeSubmission(submissionId);

        ArgumentCaptor<Submission> captor = ArgumentCaptor.forClass(Submission.class);
        verify(submissionRepository).save(captor.capture());
        Submission saved = captor.getValue();
        assertThat(saved.getResult()).isEqualTo(JudgeResult.AC);
        assertThat(saved.getPoints()).isEqualTo(100);
        assertThat(saved.getExecutionTime()).isEqualTo(2);
        assertThat(saved.getMemoryUsed()).isEqualTo(2048);
        verify(leaderboardService).evictExamLeaderboard(problemId);
        judge0.verify();
    }

    private void expectAcceptedCase(String token, String time, int memory) {
        judge0.expect(requestTo("http://judge0.test/submissions?base64_encoded=true"))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withSuccess("{\"token\":\"" + token + "\"}", MediaType.APPLICATION_JSON));
        judge0.expect(requestTo("http://judge0.test/submissions/" + token + "?base64_encoded=true&fields=stdout,stderr,compile_output,message,status,time,memory"))
            .andExpect(method(HttpMethod.GET))
            .andRespond(withSuccess("""
                {"status":{"id":3,"description":"Accepted"},"time":"%s","memory":"%d"}
                """.formatted(time, memory), MediaType.APPLICATION_JSON));
    }

    private Submission submission(UUID id, Problem problem) {
        Submission submission = new Submission();
        submission.setId(id);
        submission.setProblem(problem);
        submission.setCode("print(input())");
        submission.setLanguage("python");
        submission.setResult(JudgeResult.PENDING);
        return submission;
    }

    private Problem problem(UUID id) {
        Problem problem = new Problem();
        problem.setId(id);
        problem.setTitle("Echo");
        problem.setDescription("Echo input");
        problem.setDifficulty(Difficulty.EASY);
        problem.setTopic("basic");
        problem.setTimeLimitMs(1000);
        problem.setMemoryLimitKb(128000);
        problem.setPublished(true);
        problem.setTestCases("{\"cases\":[{\"input\":\"a\\n\",\"expected\":\"a\\n\"},{\"input\":\"b\\n\",\"expected\":\"b\\n\"}]}");
        return problem;
    }
}
