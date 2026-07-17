package com.vpt.arena.dto.battle;

import com.vpt.arena.entity.enums.JudgeResult;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class BattleSubmissionDto {
    private UUID id;
    private UUID roomId;
    private UUID userId;
    private UUID problemId;
    private String language;
    private JudgeResult result;
    private int points;
    private Integer executionTime;
    private OffsetDateTime submittedAt;

    public UUID getSubmissionId() {
        return id;
    }

    public JudgeResult getStatus() {
        return result;
    }
}
