package com.vpt.arena.dto.leaderboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GlobalLeaderboardEntryDto {
    private int rank;
    private UUID userId;
    private String publicId;
    private String userName;
    private int totalPoints;
    private int totalAccepted;
    private OffsetDateTime lastAcceptedAt;
}
