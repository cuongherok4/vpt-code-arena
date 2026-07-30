package com.vpt.arena.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatSendRequest {
    @NotBlank(message = "message is required")
    @Size(max = 2000, message = "message must be at most 2000 characters")
    private String message;
}
