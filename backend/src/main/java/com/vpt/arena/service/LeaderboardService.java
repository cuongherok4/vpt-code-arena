package com.vpt.arena.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.dto.exam.ExamLeaderboardEntryDto;
import com.vpt.arena.dto.leaderboard.GlobalLeaderboardEntryDto;
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
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private static final Duration EXAM_LEADERBOARD_TTL = Duration.ofSeconds(60);
    private static final Duration GLOBAL_LEADERBOARD_TTL = Duration.ofMinutes(5);
    private static final int DEFAULT_LIMIT = 50;
    private static final int MAX_LIMIT = 100;
    private static final TypeReference<List<ExamLeaderboardEntryDto>> EXAM_LEADERBOARD_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<GlobalLeaderboardEntryDto>> GLOBAL_LEADERBOARD_TYPE = new TypeReference<>() {};

    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public List<ExamLeaderboardEntryDto> getExamLeaderboard(UUID problemId, String language, int requestedLimit) {
        if (!problemRepository.existsById(problemId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found");
        }

        String normalizedLanguage = normalizeLanguage(language);
        int limit = normalizeLimit(requestedLimit);
        String cacheKey = cacheKey(problemId, normalizedLanguage);
        String cached = getCached(cacheKey);
        if (cached != null && !cached.isBlank()) {
            try {
                return limit(objectMapper.readValue(cached, EXAM_LEADERBOARD_TYPE), limit);
            } catch (JsonProcessingException e) {
                log.warn("Invalid exam leaderboard cache for {}: {}", problemId, e.getMessage());
                deleteCache(cacheKey);
            }
        }

        List<ExamLeaderboardEntryDto> leaderboard = buildLeaderboard(problemId, normalizedLanguage, MAX_LIMIT);
        setCache(cacheKey, leaderboard, EXAM_LEADERBOARD_TTL);
        return limit(leaderboard, limit);
    }

    public void evictExamLeaderboard(UUID problemId, String language) {
        deleteCache(cacheKey(problemId, normalizeLanguage(language)));
    }

    public List<GlobalLeaderboardEntryDto> getGlobalLeaderboard(String type, String language, int requestedLimit) {
        String normalizedType = normalizeType(type);
        String normalizedLanguage = normalizeOptionalLanguage(language);
        int limit = normalizeLimit(requestedLimit);
        String cacheKey = globalCacheKey(normalizedType, normalizedLanguage);
        String cached = getCached(cacheKey);
        if (cached != null && !cached.isBlank()) {
            try {
                return limit(objectMapper.readValue(cached, GLOBAL_LEADERBOARD_TYPE), limit);
            } catch (JsonProcessingException e) {
                log.warn("Invalid global leaderboard cache {}: {}", cacheKey, e.getMessage());
                deleteCache(cacheKey);
            }
        }

        List<GlobalLeaderboardEntryDto> leaderboard = buildGlobalLeaderboard(normalizedType, normalizedLanguage, MAX_LIMIT);
        setCache(cacheKey, leaderboard, GLOBAL_LEADERBOARD_TTL);
        return limit(leaderboard, limit);
    }

    public void evictGlobalLeaderboard(String language) {
        String normalizedLanguage = normalizeOptionalLanguage(language);
        deleteCache(List.of(
            globalCacheKey("all", null),
            globalCacheKey("exam", null),
            globalCacheKey("all", normalizedLanguage),
            globalCacheKey("exam", normalizedLanguage)
        ));
    }

    private List<ExamLeaderboardEntryDto> buildLeaderboard(UUID problemId, String language, int limit) {
        List<SubmissionRepository.ExamLeaderboardRow> rows =
            submissionRepository.findLeaderboardRows(problemId, language, JudgeResult.AC, PageRequest.of(0, limit));

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

    private List<GlobalLeaderboardEntryDto> buildGlobalLeaderboard(String type, String language, int limit) {
        List<SubmissionRepository.GlobalLeaderboardRow> rows =
            submissionRepository.findGlobalExamLeaderboardRows(JudgeResult.AC, language, PageRequest.of(0, limit));

        int[] rank = {1};
        return rows.stream()
            .map(row -> new GlobalLeaderboardEntryDto(
                rank[0]++,
                row.getUserId(),
                row.getPublicId(),
                row.getUserName(),
                intValue(row.getTotalPoints()),
                row.getTotalAccepted() == null ? 0 : row.getTotalAccepted().intValue(),
                row.getLastAcceptedAt()
            ))
            .toList();
    }

    private int intValue(Number value) {
        return value == null ? 0 : value.intValue();
    }

    private int normalizeLimit(int requestedLimit) {
        if (requestedLimit <= 0) return DEFAULT_LIMIT;
        return Math.min(requestedLimit, MAX_LIMIT);
    }

    private <T> List<T> limit(List<T> leaderboard, int limit) {
        if (leaderboard.size() <= limit) {
            return leaderboard;
        }
        return leaderboard.subList(0, limit);
    }

    private String cacheKey(UUID problemId, String language) {
        return "exam:leaderboard:" + problemId + ":" + language;
    }

    private String globalCacheKey(String type, String language) {
        return "leaderboard:global:" + type + ":" + (language == null ? "all" : language);
    }

    private String getCached(String key) {
        try {
            return stringRedisTemplate.opsForValue().get(key);
        } catch (RuntimeException e) {
            log.warn("Could not read leaderboard cache {}: {}", key, e.getMessage());
            return null;
        }
    }

    private void setCache(String key, Object value, Duration ttl) {
        try {
            stringRedisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(value), ttl);
        } catch (JsonProcessingException e) {
            log.warn("Could not serialize leaderboard cache {}: {}", key, e.getMessage());
        } catch (RuntimeException e) {
            log.warn("Could not write leaderboard cache {}: {}", key, e.getMessage());
        }
    }

    private void deleteCache(String key) {
        try {
            stringRedisTemplate.delete(key);
        } catch (RuntimeException e) {
            log.warn("Could not delete leaderboard cache {}: {}", key, e.getMessage());
        }
    }

    private void deleteCache(List<String> keys) {
        try {
            stringRedisTemplate.delete(keys);
        } catch (RuntimeException e) {
            log.warn("Could not delete leaderboard cache keys: {}", e.getMessage());
        }
    }

    private String normalizeType(String type) {
        if (type == null || type.isBlank()) return "all";
        String normalized = type.trim().toLowerCase(Locale.ROOT);
        if (normalized.equals("all") || normalized.equals("exam")) return normalized;
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported leaderboard type");
    }

    private String normalizeOptionalLanguage(String language) {
        if (language == null || language.isBlank() || language.equalsIgnoreCase("all")) return null;
        return normalizeLanguage(language);
    }

    private String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Language is required");
        }
        String normalized = language.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "c", "java", "python", "python3" -> normalized.equals("python3") ? "python" : normalized;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported language");
        };
    }
}
