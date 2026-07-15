package com.vpt.arena.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.dto.exam.ExamLeaderboardEntryDto;
import com.vpt.arena.entity.enums.JudgeResult;
import com.vpt.arena.repository.ProblemRepository;
import com.vpt.arena.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private static final Duration EXAM_LEADERBOARD_TTL = Duration.ofSeconds(60);
    private static final int DEFAULT_LIMIT = 50;
    private static final int MAX_LIMIT = 100;
    private static final TypeReference<List<ExamLeaderboardEntryDto>> LEADERBOARD_TYPE = new TypeReference<>() {};

    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public List<ExamLeaderboardEntryDto> getExamLeaderboard(UUID problemId, int requestedLimit) {
        if (!problemRepository.existsById(problemId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found");
        }

        int limit = normalizeLimit(requestedLimit);
        String cacheKey = cacheKey(problemId);
        String cached = stringRedisTemplate.opsForValue().get(cacheKey);
        if (cached != null && !cached.isBlank()) {
            try {
                return limit(objectMapper.readValue(cached, LEADERBOARD_TYPE), limit);
            } catch (JsonProcessingException e) {
                log.warn("Invalid exam leaderboard cache for {}: {}", problemId, e.getMessage());
                stringRedisTemplate.delete(cacheKey);
            }
        }

        List<ExamLeaderboardEntryDto> leaderboard = buildLeaderboard(problemId, MAX_LIMIT);
        try {
            stringRedisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(leaderboard), EXAM_LEADERBOARD_TTL);
        } catch (JsonProcessingException e) {
            log.warn("Could not cache exam leaderboard for {}: {}", problemId, e.getMessage());
        }
        return limit(leaderboard, limit);
    }

    public void evictExamLeaderboard(UUID problemId) {
        stringRedisTemplate.delete(cacheKey(problemId));
    }

    private List<ExamLeaderboardEntryDto> buildLeaderboard(UUID problemId, int limit) {
        List<SubmissionRepository.ExamLeaderboardRow> rows =
            submissionRepository.findLeaderboardRows(problemId, JudgeResult.AC, PageRequest.of(0, limit));

        int[] rank = {1};
        return rows.stream()
            .map(row -> new ExamLeaderboardEntryDto(
                rank[0]++,
                row.getUserId(),
                row.getUserName(),
                row.getPoints() == null ? 0 : row.getPoints(),
                row.getExecutionTime(),
                row.getMemoryUsed(),
                row.getSubmittedAt(),
                row.getAcceptedCount() == null ? 0L : row.getAcceptedCount()
            ))
            .toList();
    }

    private int normalizeLimit(int requestedLimit) {
        if (requestedLimit <= 0) return DEFAULT_LIMIT;
        return Math.min(requestedLimit, MAX_LIMIT);
    }

    private List<ExamLeaderboardEntryDto> limit(List<ExamLeaderboardEntryDto> leaderboard, int limit) {
        if (leaderboard.size() <= limit) {
            return leaderboard;
        }
        return leaderboard.subList(0, limit);
    }

    private String cacheKey(UUID problemId) {
        return "exam:leaderboard:" + problemId;
    }
}
