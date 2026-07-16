package com.vpt.arena.dto.battle;

import com.vpt.arena.entity.enums.Difficulty;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BattleRoomCreateRequest {

    @NotBlank(message = "name is required")
    private String name;

    @JsonProperty("isPublic")
    private boolean isPublic = false;

    @Min(value = 2, message = "maxMembers must be at least 2")
    @Max(value = 20, message = "maxMembers must be at most 20")
    private int maxMembers = 20;

    @Min(value = 1, message = "numProblems must be at least 1")
    @Max(value = 10, message = "numProblems must be at most 10")
    private int numProblems = 3;

    @Min(value = 10, message = "timeLimitMin must be at least 10")
    @Max(value = 180, message = "timeLimitMin must be at most 180")
    private int timeLimitMin = 30;

    private Difficulty difficulty;

    private String topic;
}
