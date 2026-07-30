package com.vpt.arena.dto.battle;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BattleInviteDto {
    private UUID roomId;
    private String roomName;
    private UUID inviterId;
    private String inviterName;
    private UUID inviteeId;
}
