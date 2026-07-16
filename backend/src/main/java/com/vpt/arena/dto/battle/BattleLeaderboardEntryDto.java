package com.vpt.arena.dto.battle;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BattleLeaderboardEntryDto {
    private UUID userId;
    private String name;
    private int rank;
    private int totalPoints;
    private int acceptedCount;
    private OffsetDateTime lastAcceptedAt;

    public OffsetDateTime getLastAcTime() {
        return lastAcceptedAt;
    }
}
