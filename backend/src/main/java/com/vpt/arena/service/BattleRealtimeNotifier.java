package com.vpt.arena.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.dto.battle.BattleLeaderboardEntryDto;
import com.vpt.arena.dto.battle.BattleRoomDto;
import com.vpt.arena.dto.battle.BattleSubmissionDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BattleRealtimeNotifier {

    private static final String BATTLE_EVENTS_CHANNEL = "battle:events";

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public void publishStarted(BattleRoomDto room) {
        publish("started", room.getId(), null, Map.of(
            "roomId", room.getId(),
            "startTime", room.getStartTime(),
            "endTime", room.getEndTime(),
            "problems", room.getProblems()
        ));
    }

    public void publishSubmissionResult(BattleSubmissionDto submission) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("submissionId", submission.getId());
        payload.put("problemId", submission.getProblemId());
        payload.put("result", submission.getResult());
        payload.put("points", submission.getPoints());
        payload.put("executionTime", submission.getExecutionTime());
        payload.put("output", submission.getOutput());
        payload.put("errorOutput", submission.getErrorOutput());
        publish("submission-result", submission.getRoomId(), submission.getUserId(), payload);
    }

    public void publishLeaderboard(UUID roomId, List<BattleLeaderboardEntryDto> leaderboard) {
        publish("leaderboard-update", roomId, null, Map.of(
            "roomId", roomId,
            "leaderboard", leaderboard
        ));
    }

    public void publishFinished(UUID roomId, List<BattleLeaderboardEntryDto> finalLeaderboard) {
        publish("finished", roomId, null, Map.of(
            "roomId", roomId,
            "finalLeaderboard", finalLeaderboard
        ));
    }

    private void publish(String type, UUID roomId, UUID userId, Map<String, Object> payload) {
        Runnable action = () -> {
            try {
                Map<String, Object> event = userId == null
                    ? Map.of("type", type, "roomId", roomId, "payload", payload)
                    : Map.of("type", type, "roomId", roomId, "userId", userId, "payload", payload);
                stringRedisTemplate.convertAndSend(BATTLE_EVENTS_CHANNEL, objectMapper.copy().findAndRegisterModules().writeValueAsString(event));
            } catch (JsonProcessingException e) {
                log.warn("Could not serialize battle realtime event {} for room {}: {}", type, roomId, e.getMessage());
            } catch (RuntimeException e) {
                log.warn("Could not publish battle realtime event {} for room {}: {}", type, roomId, e.getMessage());
            }
        };

        if (TransactionSynchronizationManager.isActualTransactionActive()
            && TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }
}
