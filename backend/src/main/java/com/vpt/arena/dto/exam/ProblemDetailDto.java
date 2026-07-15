package com.vpt.arena.dto.exam;

import com.vpt.arena.entity.enums.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProblemDetailDto {
    private UUID id;
    private String title;
    private String description;
    private Difficulty difficulty;
    private String topic;
    private int timeLimitMs;
    private int memoryLimitKb;
    private List<SampleCaseDto> sampleCases;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SampleCaseDto {
        private String input;
        private String expected;
    }
}
