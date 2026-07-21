package com.vpt.arena.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class BattleInviteChatRequest {
    @NotNull(message = "roomId is required")
    private UUID roomId;
}
