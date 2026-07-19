package com.vpt.arena.dto.admin;

import com.vpt.arena.entity.enums.Difficulty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class AdminProblemRequest {
    @NotBlank
    @Size(max = 255)
    private String title;

    @NotBlank
    private String description;

    @NotNull
    private Difficulty difficulty;

    @NotBlank
    @Size(max = 100)
    private String topic;

    @Min(500)
    @Max(30000)
    private int timeLimitMs = 2000;

    @Min(1024)
    @Max(2048000)
    private int memoryLimitKb = 256000;

    @NotEmpty
    private List<@Valid AdminProblemTestCaseDto> testCases;

    private String solutionCode;

    private boolean published;
}
