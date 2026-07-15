package com.vpt.arena.dto.exam;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ExamSubmitRequest {
    @NotBlank(message = "sourceCode is required")
    private String sourceCode;

    @NotBlank(message = "language is required")
    private String language;
}
