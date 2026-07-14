package com.vpt.arena.dto.learn;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RunCodeRequest {
    @NotBlank(message = "sourceCode is required")
    private String sourceCode;
    private Integer languageId;
}
