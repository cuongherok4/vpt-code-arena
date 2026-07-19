package com.vpt.arena.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.dto.exam.ExamLeaderboardEntryDto;
import com.vpt.arena.dto.leaderboard.GlobalLeaderboardEntryDto;
import com.vpt.arena.entity.enums.JudgeResult;
import com.vpt.arena.repository.ProblemRepository;
import com.vpt.arena.repository.SubmissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("LeaderboardService Unit Tests")
class LeaderboardServiceTest {

    @Mock private SubmissionRepository submissionRepository;
    @Mock private ProblemRepository problemRepository;
    @Mock private StringRedisTemplate stringRedisTemplate;
    @Mock private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private LeaderboardService leaderboardService;

    @BeforeEach
    void setUp() {
        org.springframework.test.util.ReflectionTestUtils.setField(
            leaderboardService,
            "objectMapper",
            new ObjectMapper().findAndRegisterModules()
        );
    }

    @Test
    @DisplayName("Đọc leaderboard từ cache khi có")
    void shouldReturnCachedLeaderboard() throws Exception {
        UUID problemId = UUID.randomUUID();
        when(problemRepository.existsById(problemId)).thenReturn(true);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn("""
            [{"rank":1,"userId":"11111111-1111-4111-8111-111111111111","userName":"Alice","points":100,"executionTime":12,"memoryUsed":2048,"submittedAt":null,"acceptedCount":2}]
            """);

        List<ExamLeaderboardEntryDto> result = leaderboardService.getExamLeaderboard(problemId, "python", 50);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getUserName()).isEqualTo("Alice");
        verify(submissionRepository, never()).findLeaderboardRows(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Query DB và cache leaderboard khi cache miss")
    void shouldQueryAndCacheWhenMiss() {
        UUID problemId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        OffsetDateTime submittedAt = OffsetDateTime.now();
        SubmissionRepository.ExamLeaderboardRow row = row(userId, "Bob", 200, 8, 1024, submittedAt, 1L);

        when(problemRepository.existsById(problemId)).thenReturn(true);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(null);
        when(submissionRepository.findLeaderboardRows(eq(problemId), eq("python"), eq(JudgeResult.AC), any(Pageable.class)))
            .thenReturn(List.of(row));

        List<ExamLeaderboardEntryDto> result = leaderboardService.getExamLeaderboard(problemId, "python", 10);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getRank()).isEqualTo(1);
        assertThat(result.getFirst().getPoints()).isEqualTo(200);
        verify(valueOperations).set(anyString(), anyString(), any(java.time.Duration.class));
    }

    @Test
    @DisplayName("Throw 404 khi problem không tồn tại")
    void shouldThrowWhenProblemNotFound() {
        UUID problemId = UUID.randomUUID();
        when(problemRepository.existsById(problemId)).thenReturn(false);

        assertThatThrownBy(() -> leaderboardService.getExamLeaderboard(problemId, "python", 50))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Problem not found");
    }

    @Test
    @DisplayName("Evict cache theo problem")
    void shouldEvictProblemLeaderboardKey() {
        UUID problemId = UUID.randomUUID();

        leaderboardService.evictExamLeaderboard(problemId, "python");

        verify(stringRedisTemplate).delete("exam:leaderboard:" + problemId + ":python");
    }

    @Test
    @DisplayName("Global leaderboard đọc từ cache khi có")
    void shouldReturnCachedGlobalLeaderboard() throws Exception {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("leaderboard:global:all:all")).thenReturn("""
            [{"rank":1,"userId":"11111111-1111-4111-8111-111111111111","publicId":"1000000001","userName":"Alice","totalPoints":300,"totalAccepted":2,"lastAcceptedAt":null}]
            """);

        List<GlobalLeaderboardEntryDto> result = leaderboardService.getGlobalLeaderboard("all", null, 50);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getPublicId()).isEqualTo("1000000001");
        assertThat(result.getFirst().getTotalPoints()).isEqualTo(300);
        verify(submissionRepository, never()).findGlobalExamLeaderboardRows(any(), any(), any());
    }

    @Test
    @DisplayName("Global leaderboard query DB và cache khi miss")
    void shouldQueryGlobalLeaderboardWhenCacheMiss() {
        UUID userId = UUID.randomUUID();
        OffsetDateTime lastAcceptedAt = OffsetDateTime.now();
        SubmissionRepository.GlobalLeaderboardRow row = globalRow(userId, "1000000002", "Bob", 500, 3L, lastAcceptedAt);

        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("leaderboard:global:exam:python")).thenReturn(null);
        when(submissionRepository.findGlobalExamLeaderboardRows(eq(JudgeResult.AC), eq("python"), any(Pageable.class))).thenReturn(List.of(row));

        List<GlobalLeaderboardEntryDto> result = leaderboardService.getGlobalLeaderboard("exam", "python", 10);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getRank()).isEqualTo(1);
        assertThat(result.getFirst().getTotalAccepted()).isEqualTo(3);
        verify(valueOperations).set(eq("leaderboard:global:exam:python"), anyString(), any(java.time.Duration.class));
    }

    private SubmissionRepository.ExamLeaderboardRow row(
            UUID userId,
            String userName,
            Integer points,
            Integer executionTime,
            Integer memoryUsed,
            OffsetDateTime submittedAt,
            Long acceptedCount) {
        return new SubmissionRepository.ExamLeaderboardRow() {
            @Override public UUID getUserId() { return userId; }
            @Override public String getUserName() { return userName; }
            @Override public Integer getPoints() { return points; }
            @Override public Integer getExecutionTime() { return executionTime; }
            @Override public Integer getMemoryUsed() { return memoryUsed; }
            @Override public OffsetDateTime getSubmittedAt() { return submittedAt; }
            @Override public Long getAcceptedCount() { return acceptedCount; }
        };
    }

    private SubmissionRepository.GlobalLeaderboardRow globalRow(
            UUID userId,
            String publicId,
            String userName,
            Number totalPoints,
            Long totalAccepted,
            OffsetDateTime lastAcceptedAt) {
        return new SubmissionRepository.GlobalLeaderboardRow() {
            @Override public UUID getUserId() { return userId; }
            @Override public String getPublicId() { return publicId; }
            @Override public String getUserName() { return userName; }
            @Override public Number getTotalPoints() { return totalPoints; }
            @Override public Long getTotalAccepted() { return totalAccepted; }
            @Override public OffsetDateTime getLastAcceptedAt() { return lastAcceptedAt; }
        };
    }
}
