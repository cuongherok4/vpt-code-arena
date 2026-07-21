package com.vpt.arena.dto.chat;

import com.vpt.arena.entity.enums.MessageType;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class ChatMessageDto {
    private UUID id;
    private String channel;
    private UUID roomId;
    private String roomName;
    private UUID senderId;
    private String senderName;
    private String senderEmail;
    private UUID receiverId;
    private String receiverName;
    private UUID battleRoomId;
    private String battleRoomName;
    private String battleRoomCode;
    private String message;
    private MessageType type;
    private boolean deleted;
    private boolean read;
    private OffsetDateTime createdAt;
}
