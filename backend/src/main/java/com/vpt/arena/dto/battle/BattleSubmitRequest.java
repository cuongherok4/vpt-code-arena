package com.vpt.arena.dto.battle;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class BattleSubmitRequest {
    @NotNull(message = "problemId is required")
    private UUID problemId;

    @JsonAlias("code")
    @NotBlank(message = "sourceCode is required")
    private String sourceCode;

    @NotBlank(message = "language is required")
    private String language;
}
