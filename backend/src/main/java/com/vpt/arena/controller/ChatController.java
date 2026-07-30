package com.vpt.arena.controller;

import com.vpt.arena.dto.chat.ChatConversationDto;
import com.vpt.arena.dto.chat.ChatMessageDto;
import com.vpt.arena.dto.chat.ChatSendRequest;
import com.vpt.arena.dto.chat.BattleInviteChatRequest;
import com.vpt.arena.dto.chat.MuteUserRequest;
import com.vpt.arena.dto.chat.ReportMessageRequest;
import com.vpt.arena.security.CustomUserDetails;
import com.vpt.arena.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/chat")
@Tag(name = "Chat", description = "Chat history, messages, reports, and mutes")
public class ChatController {
    private final ChatService chatService;

    @GetMapping("/global")
    @Operation(summary = "Get global chat history")
    public List<ChatMessageDto> globalHistory(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime before,
            @RequestParam(defaultValue = "50") int limit) {
        return chatService.globalHistory(requirePrincipal(principal).getId(), before, limit);
    }

    @PostMapping("/global")
    @Operation(summary = "Send a global chat message")
    public ChatMessageDto sendGlobal(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody ChatSendRequest request) {
        return chatService.sendGlobal(requirePrincipal(principal).getId(), request.getMessage());
    }

    @PostMapping("/global/battle-invite")
    @Operation(summary = "Share a waiting battle room to global chat")
    public ChatMessageDto sendGlobalBattleInvite(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody BattleInviteChatRequest request) {
        return chatService.sendGlobalBattleInvite(requirePrincipal(principal).getId(), request.getRoomId());
    }

    @GetMapping("/rooms/{roomId}")
    @Operation(summary = "Get room chat history")
    public List<ChatMessageDto> roomHistory(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID roomId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime before,
            @RequestParam(defaultValue = "50") int limit) {
        return chatService.roomHistory(requirePrincipal(principal).getId(), roomId, before, limit);
    }

    @PostMapping("/rooms/{roomId}")
    @Operation(summary = "Send a room chat message")
    public ChatMessageDto sendRoom(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID roomId,
            @Valid @RequestBody ChatSendRequest request) {
        return chatService.sendRoom(requirePrincipal(principal).getId(), roomId, request.getMessage());
    }

    @GetMapping("/dm/conversations")
    @Operation(summary = "Get direct message conversations")
    public List<ChatConversationDto> conversations(@AuthenticationPrincipal CustomUserDetails principal) {
        return chatService.conversations(requirePrincipal(principal).getId());
    }

    @GetMapping("/dm/{userId}")
    @Operation(summary = "Get direct message history with a user")
    public List<ChatMessageDto> directHistory(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime before,
            @RequestParam(defaultValue = "50") int limit) {
        return chatService.directHistory(requirePrincipal(principal).getId(), userId, before, limit);
    }

    @PostMapping("/dm/{userId}")
    @Operation(summary = "Send a direct message")
    public ChatMessageDto sendDirect(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID userId,
            @Valid @RequestBody ChatSendRequest request) {
        return chatService.sendDirect(requirePrincipal(principal).getId(), userId, request.getMessage());
    }

    @PostMapping("/dm/{userId}/read")
    @Operation(summary = "Mark direct messages from a user as read")
    public Map<String, String> markDirectMessagesAsRead(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID userId) {
        chatService.markDirectMessagesAsRead(requirePrincipal(principal).getId(), userId);
        return Map.of("message", "Marked as read");
    }

    @PostMapping("/messages/{kind}/{messageId}/report")
    @Operation(summary = "Report a chat or direct message")
    public Map<String, String> report(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable String kind,
            @PathVariable UUID messageId,
            @Valid @RequestBody ReportMessageRequest request) {
        chatService.report(requirePrincipal(principal).getId(), kind, messageId, request.getReason());
        return Map.of("message", "Reported");
    }

    @DeleteMapping("/messages/{kind}/{messageId}")
    @Operation(summary = "Delete your own message or any message as admin")
    public Map<String, String> delete(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable String kind,
            @PathVariable UUID messageId) {
        chatService.delete(requirePrincipal(principal).getId(), kind, messageId);
        return Map.of("message", "Deleted");
    }

    @PostMapping("/mutes/{userId}")
    @Operation(summary = "Mute a user in chat")
    public Map<String, String> mute(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID userId,
            @Valid @RequestBody(required = false) MuteUserRequest request) {
        chatService.mute(requirePrincipal(principal).getId(), userId, request == null ? null : request.getMinutes());
        return Map.of("message", "Muted");
    }

    @DeleteMapping("/mutes/{userId}")
    @Operation(summary = "Unmute a user in chat")
    public Map<String, String> unmute(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID userId) {
        chatService.unmute(requirePrincipal(principal).getId(), userId);
        return Map.of("message", "Unmuted");
    }

    private CustomUserDetails requirePrincipal(CustomUserDetails principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal;
    }
}
