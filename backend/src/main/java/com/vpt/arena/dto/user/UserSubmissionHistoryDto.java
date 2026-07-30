package com.vpt.arena.dto.user;

import com.vpt.arena.entity.enums.JudgeResult;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class UserSubmissionHistoryDto {
    private UUID id;
    private String type;
    private UUID problemId;
    private String problemTitle;
    private UUID roomId;
    private String roomName;
    private String language;
    private JudgeResult result;
    private int points;
    private Integer executionTime;
    private OffsetDateTime submittedAt;
}
