package com.vpt.arena.dto.chat;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class ChatConversationDto {
    private UUID userId;
    private String userName;
    private String userEmail;
    private String lastMessage;
    private OffsetDateTime lastMessageAt;
    private boolean unread;
}
