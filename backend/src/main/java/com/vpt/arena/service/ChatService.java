package com.vpt.arena.service;

import com.vpt.arena.dto.chat.ChatConversationDto;
import com.vpt.arena.dto.chat.ChatMessageDto;
import com.vpt.arena.entity.ChatMessage;
import com.vpt.arena.entity.ChatMute;
import com.vpt.arena.entity.DirectMessage;
import com.vpt.arena.entity.MessageReport;
import com.vpt.arena.entity.Room;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.MessageType;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.repository.ChatMessageRepository;
import com.vpt.arena.repository.ChatMuteRepository;
import com.vpt.arena.repository.DirectMessageRepository;
import com.vpt.arena.repository.MessageReportRepository;
import com.vpt.arena.repository.RoomRepository;
import com.vpt.arena.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    private static final int MAX_LIMIT = 100;

    private final ChatMessageRepository chatMessageRepository;
    private final DirectMessageRepository directMessageRepository;
    private final ChatMuteRepository chatMuteRepository;
    private final MessageReportRepository messageReportRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;

    @Transactional(readOnly = true)
    public List<ChatMessageDto> globalHistory(UUID currentUserId, OffsetDateTime before, int limit) {
        Set<UUID> mutedUserIds = mutedUserIds(currentUserId);
        return chatMessageRepository.findGlobalMessages(before, page(limit)).stream()
            .filter(message -> !mutedUserIds.contains(message.getUser().getId()))
            .sorted(Comparator.comparing(ChatMessage::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(this::toDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> roomHistory(UUID currentUserId, UUID roomId, OffsetDateTime before, int limit) {
        Set<UUID> mutedUserIds = mutedUserIds(currentUserId);
        return chatMessageRepository.findRoomMessages(roomId, before, page(limit)).stream()
            .filter(message -> !mutedUserIds.contains(message.getUser().getId()))
            .sorted(Comparator.comparing(ChatMessage::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(this::toDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> directHistory(UUID currentUserId, UUID otherUserId, OffsetDateTime before, int limit) {
        ensureUserExists(otherUserId);
        return directMessageRepository.findConversation(currentUserId, otherUserId, before, page(limit)).stream()
            .sorted(Comparator.comparing(DirectMessage::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(message -> toDto(message, currentUserId))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatConversationDto> conversations(UUID currentUserId) {
        Map<UUID, ChatConversationDto> conversations = new LinkedHashMap<>();
        directMessageRepository.findRecentForUser(currentUserId, PageRequest.of(0, 200)).forEach(message -> {
            User other = message.getSender().getId().equals(currentUserId) ? message.getReceiver() : message.getSender();
            conversations.putIfAbsent(other.getId(), ChatConversationDto.builder()
                .userId(other.getId())
                .userName(other.getName())
                .userEmail(other.getEmail())
                .lastMessage(message.getDeletedAt() == null ? message.getMessage() : null)
                .lastMessageAt(message.getCreatedAt())
                .unread(message.getReceiver().getId().equals(currentUserId) && !message.isRead())
                .build());
        });
        return List.copyOf(conversations.values());
    }

    @Transactional
    public ChatMessageDto sendGlobal(UUID senderId, String text) {
        User sender = findUser(senderId);
        ChatMessage message = new ChatMessage();
        message.setUser(sender);
        message.setMessage(normalizeMessage(text));
        message.setType(MessageType.TEXT);
        return toDto(chatMessageRepository.save(message));
    }

    @Transactional
    public ChatMessageDto sendRoom(UUID senderId, UUID roomId, String text) {
        User sender = findUser(senderId);
        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        ChatMessage message = new ChatMessage();
        message.setUser(sender);
        message.setRoom(room);
        message.setMessage(normalizeMessage(text));
        message.setType(MessageType.TEXT);
        return toDto(chatMessageRepository.save(message));
    }

    @Transactional
    public ChatMessageDto sendDirect(UUID senderId, UUID receiverId, String text) {
        if (senderId.equals(receiverId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot send direct message to yourself");
        }
        User sender = findUser(senderId);
        User receiver = findUser(receiverId);
        DirectMessage message = new DirectMessage();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setMessage(normalizeMessage(text));
        return toDto(directMessageRepository.save(message), senderId);
    }

    @Transactional
    public void report(UUID reporterId, String kind, UUID messageId, String reason) {
        findMessage(kind, messageId);
        MessageReport report = new MessageReport();
        report.setReportedBy(findUser(reporterId));
        report.setMessageKind(normalizeKind(kind));
        report.setMessageId(messageId);
        report.setReason(normalizeReason(reason));
        messageReportRepository.save(report);
    }

    @Transactional
    public void delete(UUID actorId, String kind, UUID messageId) {
        User actor = findUser(actorId);
        String normalizedKind = normalizeKind(kind);
        if ("DM".equals(normalizedKind)) {
            DirectMessage message = directMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));
            if (!canDelete(actor, message.getSender().getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot delete this message");
            }
            message.setDeletedAt(OffsetDateTime.now());
            message.setDeletedBy(actor);
            directMessageRepository.save(message);
            return;
        }

        ChatMessage message = chatMessageRepository.findById(messageId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));
        if (!canDelete(actor, message.getUser().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot delete this message");
        }
        message.setDeletedAt(OffsetDateTime.now());
        message.setDeletedBy(actor);
        chatMessageRepository.save(message);
    }

    @Transactional
    public void mute(UUID ownerId, UUID mutedUserId, Integer minutes) {
        if (ownerId.equals(mutedUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot mute yourself");
        }
        User owner = findUser(ownerId);
        User mutedUser = findUser(mutedUserId);
        ChatMute mute = chatMuteRepository.findByOwnerAndMutedUser(owner, mutedUser).orElseGet(ChatMute::new);
        mute.setOwner(owner);
        mute.setMutedUser(mutedUser);
        mute.setExpiresAt(minutes == null ? null : OffsetDateTime.now().plusMinutes(minutes));
        chatMuteRepository.save(mute);
    }

    @Transactional
    public void unmute(UUID ownerId, UUID mutedUserId) {
        chatMuteRepository.deleteByOwnerAndMutedUser(findUser(ownerId), findUser(mutedUserId));
    }

    private Object findMessage(String kind, UUID messageId) {
        return "DM".equals(normalizeKind(kind))
            ? directMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"))
            : chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));
    }

    private boolean canDelete(User actor, UUID ownerId) {
        return actor.getId().equals(ownerId) || actor.getRole() == Role.ADMIN;
    }

    private Set<UUID> mutedUserIds(UUID currentUserId) {
        return chatMuteRepository.findActiveMutedUserIds(currentUserId, OffsetDateTime.now())
            .stream()
            .collect(Collectors.toSet());
    }

    private PageRequest page(int limit) {
        return PageRequest.of(0, Math.max(1, Math.min(limit, MAX_LIMIT)));
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void ensureUserExists(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
    }

    private String normalizeMessage(String message) {
        return message.trim();
    }

    private String normalizeReason(String reason) {
        return reason == null || reason.isBlank() ? null : reason.trim();
    }

    private String normalizeKind(String kind) {
        String normalized = kind == null ? "" : kind.trim().toUpperCase();
        if (!Set.of("GLOBAL", "ROOM", "DM").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid message kind");
        }
        return normalized;
    }

    private ChatMessageDto toDto(ChatMessage message) {
        boolean deleted = message.getDeletedAt() != null;
        return ChatMessageDto.builder()
            .id(message.getId())
            .channel(message.getRoom() == null ? "GLOBAL" : "ROOM")
            .roomId(message.getRoom() == null ? null : message.getRoom().getId())
            .roomName(message.getRoom() == null ? null : message.getRoom().getName())
            .senderId(message.getUser().getId())
            .senderName(message.getUser().getName())
            .senderEmail(message.getUser().getEmail())
            .message(deleted ? null : message.getMessage())
            .type(message.getType())
            .deleted(deleted)
            .read(true)
            .createdAt(message.getCreatedAt())
            .build();
    }

    private ChatMessageDto toDto(DirectMessage message, UUID currentUserId) {
        boolean deleted = message.getDeletedAt() != null;
        User other = message.getSender().getId().equals(currentUserId) ? message.getReceiver() : message.getSender();
        return ChatMessageDto.builder()
            .id(message.getId())
            .channel("DM")
            .senderId(message.getSender().getId())
            .senderName(message.getSender().getName())
            .senderEmail(message.getSender().getEmail())
            .receiverId(other.getId())
            .receiverName(other.getName())
            .message(deleted ? null : message.getMessage())
            .type(MessageType.TEXT)
            .deleted(deleted)
            .read(message.isRead())
            .createdAt(message.getCreatedAt())
            .build();
    }
}
