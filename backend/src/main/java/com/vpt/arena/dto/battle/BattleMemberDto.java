package com.vpt.arena.dto.battle;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BattleMemberDto {
    private UUID userId;
    private String publicId;
    private String name;
    private boolean ready;
    private boolean creator;
    private OffsetDateTime joinedAt;
}
