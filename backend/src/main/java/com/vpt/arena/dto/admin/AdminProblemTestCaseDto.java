package com.vpt.arena.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminProblemTestCaseDto {
    @NotNull
    private String input;

    @NotNull
    private String expectedOutput;

    @JsonProperty("isHidden")
    private boolean hidden;
}
