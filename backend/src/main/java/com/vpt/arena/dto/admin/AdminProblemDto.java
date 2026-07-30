package com.vpt.arena.dto.admin;

import com.vpt.arena.entity.enums.Difficulty;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class AdminProblemDto {
    private UUID id;
    private String title;
    private String description;
    private Difficulty difficulty;
    private String topic;
    private int timeLimitMs;
    private int memoryLimitKb;
    private List<AdminProblemTestCaseDto> testCases;
    private String solutionCode;
    private boolean published;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
