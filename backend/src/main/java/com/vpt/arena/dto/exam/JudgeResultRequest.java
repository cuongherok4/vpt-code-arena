package com.vpt.arena.dto.exam;

import com.vpt.arena.entity.enums.JudgeResult;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class JudgeResultRequest {
    @NotNull(message = "submissionId is required")
    private UUID submissionId;

    @NotNull(message = "result is required")
    private JudgeResult result;

    private Integer points;
    private Integer executionTime;
    private Integer memoryUsed;
    private String errorOutput;
}
