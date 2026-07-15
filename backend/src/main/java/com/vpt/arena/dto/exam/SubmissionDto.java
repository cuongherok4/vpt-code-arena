package com.vpt.arena.dto.exam;

import com.vpt.arena.entity.enums.JudgeResult;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class SubmissionDto {
    private UUID id;
    private UUID problemId;
    private String language;
    private JudgeResult result;
    private int points;
    private Integer executionTime;
    private Integer memoryUsed;
    private String output;
    private String errorOutput;
    private OffsetDateTime submittedAt;
}
