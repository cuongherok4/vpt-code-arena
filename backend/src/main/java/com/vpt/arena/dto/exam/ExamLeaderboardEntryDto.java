package com.vpt.arena.dto.exam;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamLeaderboardEntryDto {
    private int rank;
    private UUID userId;
    private String userName;
    private int points;
    private Integer executionTime;
    private Integer memoryUsed;
    private OffsetDateTime submittedAt;
    private long acceptedCount;
}
