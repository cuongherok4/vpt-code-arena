package com.vpt.arena.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.dto.battle.BattleLeaderboardEntryDto;
import com.vpt.arena.dto.battle.BattleSubmissionDto;
import com.vpt.arena.dto.battle.BattleSubmitRequest;
import com.vpt.arena.entity.BattleSubmission;
import com.vpt.arena.entity.Problem;
import com.vpt.arena.entity.Room;
import com.vpt.arena.entity.RoomMember;
import com.vpt.arena.entity.RoomResult;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.Difficulty;
import com.vpt.arena.entity.enums.JudgeResult;
import com.vpt.arena.entity.enums.RoomStatus;
import com.vpt.arena.repository.BattleRoomProblemRepository;
import com.vpt.arena.repository.BattleSubmissionRepository;
import com.vpt.arena.repository.RoomMemberRepository;
import com.vpt.arena.repository.RoomRepository;
import com.vpt.arena.repository.RoomResultRepository;
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
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class BattleJudgeService {

    private final BattleSubmissionRepository battleSubmissionRepository;
    private final BattleRoomProblemRepository battleRoomProblemRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomRepository roomRepository;
    private final RoomResultRepository roomResultRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final BattleRealtimeNotifier battleRealtimeNotifier;
    private final TransactionTemplate transactionTemplate;
    private final UserStatsService userStatsService;

    @Value("${judge0.url}")
    private String judge0Url;
    @Value("${judge0.poll-interval-ms:250}")
    private long judge0PollIntervalMs;
    @Value("${judge0.timeout-ms:10000}")
    private long judge0TimeoutMs;
    @Value("${judge0.java-memory-limit-kb:2048000}")
    private int judge0JavaMemoryLimitKb;
    @Value("${judge0.java-max-processes-and-threads:512}")
    private int judge0JavaMaxProcessesAndThreads;

    @Transactional
    public BattleSubmissionDto submit(UUID roomId, UUID userId, BattleSubmitRequest request) {
        Room room = roomRepository.findDetailedByIdForUpdate(roomId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        ensureRoomAcceptsSubmissions(room);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not a room member");
        }

        Problem problem = battleRoomProblemRepository.findByRoomIdAndProblemId(roomId, request.getProblemId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem is not assigned to this room"))
            .getProblem();
        String language = normalizeLanguage(request.getLanguage());
        languageIdFor(language);

        BattleSubmission submission = new BattleSubmission();
        submission.setRoom(room);
        submission.setUser(user);
        submission.setProblem(problem);
        submission.setCode(request.getSourceCode());
        submission.setLanguage(language);
        submission.setResult(JudgeResult.PENDING);
        submission.setPoints(0);
        submission = battleSubmissionRepository.save(submission);
        return toDto(submission);
    }

    public void judgeSubmission(UUID submissionId) {
        BattleSubmission submission = battleSubmissionRepository.findWithRoomAndProblemAndUserById(submissionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle submission not found"));
        JudgeOutcome outcome = judge(submission);
        applyJudgeResult(submissionId, outcome);
    }

    @Transactional
    public BattleSubmissionDto markJudgeFailure(UUID submissionId) {
        return markJudgeFailure(submissionId, "Judge service failed");
    }

    public BattleSubmissionDto markJudgeFailure(UUID submissionId, String message) {
        return applyJudgeResult(submissionId, new JudgeOutcome(
            JudgeResult.RE,
            null,
            null,
            firstNonBlank(message, "Judge service failed")
        ));
    }

    public BattleSubmissionDto applyJudgeResult(UUID submissionId, JudgeResult result, Integer executionTime) {
        return applyJudgeResult(submissionId, new JudgeOutcome(result, executionTime, null, null));
    }

    private BattleSubmissionDto applyJudgeResult(UUID submissionId, JudgeOutcome outcome) {
        return transactionTemplate.execute(status -> applyJudgeResultInTransaction(submissionId, outcome));
    }

    private BattleSubmissionDto applyJudgeResultInTransaction(UUID submissionId, JudgeOutcome outcome) {
        BattleSubmission submission = battleSubmissionRepository.findWithRoomAndProblemAndUserById(submissionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle submission not found"));
        roomRepository.findDetailedByIdForUpdate(submission.getRoom().getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        if (submission.getResult() != JudgeResult.PENDING) {
            return toDto(submission);
        }

        int points = 0;
        if (outcome.result() == JudgeResult.AC) {
            int maxPoints = pointsFor(submission.getProblem().getDifficulty());
            int previousBest = battleSubmissionRepository.maxPointsByRoomUserProblemAndResult(
                submission.getRoom().getId(),
                submission.getUser().getId(),
                submission.getProblem().getId(),
                JudgeResult.AC
            );
            points = previousBest < maxPoints ? maxPoints : 0;
        }

        submission.setResult(outcome.result());
        submission.setExecutionTime(outcome.executionTime());
        submission.setOutput(blankToNull(outcome.output()));
        submission.setErrorOutput(blankToNull(outcome.errorOutput()));
        submission.setPoints(points);
        BattleSubmission saved = battleSubmissionRepository.save(submission);
        BattleSubmissionDto dto = toDto(saved);
        if (saved.getResult() == JudgeResult.AC) {
            userStatsService.refreshAfterAccepted(saved.getUser().getId());
        }
        battleRealtimeNotifier.publishSubmissionResult(dto);
        battleRealtimeNotifier.publishLeaderboard(saved.getRoom().getId(), calculateLeaderboard(saved.getRoom().getId()));
        return dto;
    }

    @Transactional(readOnly = true)
    public List<BattleLeaderboardEntryDto> leaderboard(UUID roomId) {
        return calculateLeaderboard(roomId);
    }

    @Transactional
    public List<BattleLeaderboardEntryDto> finishRoomAsUser(UUID roomId, UUID userId) {
        Room room = roomRepository.findDetailedById(roomId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        boolean isCreator = room.getCreator().getId().equals(userId);
        boolean isMember = roomMemberRepository.existsByRoomIdAndUserId(roomId, userId);
        boolean isExpired = room.getEndTime() != null && !OffsetDateTime.now().isBefore(room.getEndTime());
        if (!isCreator && (!isMember || !isExpired)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only room creator can finish before time is over");
        }
        return finishRoom(roomId);
    }

    @Transactional
    public List<BattleLeaderboardEntryDto> finishRoom(UUID roomId) {
        Room room = roomRepository.findDetailedByIdForUpdate(roomId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        if (room.getStatus() == RoomStatus.FINISHED) {
            return calculateLeaderboard(roomId);
        }

        room.setStatus(RoomStatus.FINISHED);
        roomRepository.save(room);

        List<BattleLeaderboardEntryDto> leaderboard = calculateLeaderboard(roomId);
        roomResultRepository.deleteByRoomId(roomId);
        for (BattleLeaderboardEntryDto entry : leaderboard) {
            RoomResult result = new RoomResult();
            result.setRoom(room);
            result.setUser(userRepository.findById(entry.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")));
            result.setRank(entry.getRank());
            result.setTotalPoints(entry.getTotalPoints());
            result.setLastAcTime(entry.getLastAcceptedAt());
            roomResultRepository.save(result);
        }
        battleRealtimeNotifier.publishFinished(roomId, leaderboard);
        return leaderboard;
    }

    @Transactional
    public int finishExpiredRooms() {
        List<Room> rooms = roomRepository.findByStatusAndEndTimeBefore(RoomStatus.IN_PROGRESS, OffsetDateTime.now());
        for (Room room : rooms) {
            finishRoom(room.getId());
        }
        return rooms.size();
    }

    private void ensureRoomAcceptsSubmissions(Room room) {
        if (room.getStatus() != RoomStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room is not in progress");
        }
        if (room.getEndTime() != null && OffsetDateTime.now().isAfter(room.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room time is over");
        }
    }

    private List<BattleLeaderboardEntryDto> calculateLeaderboard(UUID roomId) {
        Map<UUID, ScoreAccumulator> scores = new LinkedHashMap<>();
        Room room = roomRepository.findDetailedById(roomId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        for (RoomMember member : room.getMembers()) {
            scores.put(member.getUser().getId(), new ScoreAccumulator(member.getUser().getId(), member.getUser().getName()));
        }
        for (BattleSubmission submission : battleSubmissionRepository.findLeaderboardSubmissions(roomId)) {
            if (submission.getResult() != JudgeResult.AC) continue;
            ScoreAccumulator score = scores.computeIfAbsent(
                submission.getUser().getId(),
                id -> new ScoreAccumulator(submission.getUser().getId(), submission.getUser().getName())
            );
            UUID problemId = submission.getProblem().getId();
            int previousBest = score.acceptedProblemPoints.getOrDefault(problemId, 0);
            if (submission.getPoints() > previousBest) {
                score.acceptedProblemPoints.put(problemId, submission.getPoints());
                score.acceptedProblems.put(problemId, submission.getSubmittedAt());
                score.totalPoints += submission.getPoints() - previousBest;
                score.lastAcceptedAt = maxTime(score.lastAcceptedAt, submission.getSubmittedAt());
            }
        }

        List<ScoreAccumulator> sorted = new ArrayList<>(scores.values());
        sorted.sort(Comparator
            .comparingInt(ScoreAccumulator::totalPoints).reversed()
            .thenComparing(ScoreAccumulator::lastAcceptedAt, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(ScoreAccumulator::name));

        List<BattleLeaderboardEntryDto> result = new ArrayList<>();
        int rank = 1;
        for (ScoreAccumulator score : sorted) {
            result.add(new BattleLeaderboardEntryDto(
                score.userId,
                score.name,
                rank++,
                score.totalPoints,
                score.acceptedProblems.size(),
                score.lastAcceptedAt
            ));
        }
        return result;
    }

    private JudgeOutcome judge(BattleSubmission submission) {
        Problem problem = submission.getProblem();
        int languageId = languageIdFor(submission.getLanguage());
        try {
            JsonNode cases = objectMapper.readTree(problem.getTestCases()).path("cases");
            if (!cases.isArray() || cases.isEmpty()) {
                return new JudgeOutcome(JudgeResult.RE, null, null, "Problem has no runnable test cases");
            }

            Integer maxTimeMs = null;
            String lastOutput = null;
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
                lastOutput = firstNonBlank(result.stdout(), lastOutput);
                JudgeResult mapped = mapStatus(result.status());
                if (mapped != JudgeResult.AC) {
                    return new JudgeOutcome(
                        mapped,
                        maxTimeMs,
                        result.stdout(),
                        errorOutputFor(mapped, testCase.path("expected").asText(""), result)
                    );
                }
            }
            return new JudgeOutcome(JudgeResult.AC, maxTimeMs, lastOutput, null);
        } catch (JsonProcessingException e) {
            return new JudgeOutcome(JudgeResult.RE, null, null, "Could not read problem test cases");
        } catch (RestClientException e) {
            return new JudgeOutcome(JudgeResult.RE, null, null, "Judge service is unavailable");
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
                    decodeBase64(text(root, "stdout")),
                    decodeBase64(text(root, "stderr")),
                    decodeBase64(text(root, "compile_output")),
                    decodeBase64(text(root, "message"))
                );
            }
            sleep();
        }
        return new Judge0Result("Time Limit Exceeded", null, null, null, null, "Judge timed out");
    }

    private BattleSubmissionDto toDto(BattleSubmission submission) {
        return BattleSubmissionDto.builder()
            .id(submission.getId())
            .roomId(submission.getRoom().getId())
            .userId(submission.getUser().getId())
            .problemId(submission.getProblem().getId())
            .language(submission.getLanguage())
            .result(submission.getResult())
            .points(submission.getPoints())
            .executionTime(submission.getExecutionTime())
            .output(submission.getOutput())
            .errorOutput(submission.getErrorOutput())
            .submittedAt(submission.getSubmittedAt())
            .build();
    }

    private int pointsFor(Difficulty difficulty) {
        return switch (difficulty) {
            case EASY -> 100;
            case MEDIUM -> 200;
            case HARD -> 300;
        };
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

    private OffsetDateTime maxTime(OffsetDateTime current, OffsetDateTime next) {
        if (next == null) return current;
        return current == null || next.isAfter(current) ? next : current;
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

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return null;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String errorOutputFor(JudgeResult result, String expectedOutput, Judge0Result judge0Result) {
        if (result == JudgeResult.WA) {
            return "Expected:\n" + expectedOutput + "\nActual:\n" + firstNonBlank(judge0Result.stdout(), "");
        }
        return firstNonBlank(judge0Result.compileOutput(), judge0Result.stderr(), judge0Result.message(), judge0Result.status());
    }

    private record Judge0Result(
        String status,
        Integer executionTimeMs,
        String stdout,
        String stderr,
        String compileOutput,
        String message
    ) {}

    private record JudgeOutcome(JudgeResult result, Integer executionTime, String output, String errorOutput) {}

    private static class ScoreAccumulator {
        private final UUID userId;
        private final String name;
        private final Map<UUID, OffsetDateTime> acceptedProblems = new LinkedHashMap<>();
        private final Map<UUID, Integer> acceptedProblemPoints = new LinkedHashMap<>();
        private int totalPoints = 0;
        private OffsetDateTime lastAcceptedAt;

        private ScoreAccumulator(UUID userId, String name) {
            this.userId = userId;
            this.name = name;
        }

        private int totalPoints() {
            return totalPoints;
        }

        private OffsetDateTime lastAcceptedAt() {
            return lastAcceptedAt;
        }

        private String name() {
            return name;
        }
    }
}
