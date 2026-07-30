package com.vpt.arena.service;

import com.vpt.arena.dto.chat.ChatMessageDto;
import com.vpt.arena.entity.ChatMessage;
import com.vpt.arena.entity.DirectMessage;
import com.vpt.arena.entity.Problem;
import com.vpt.arena.entity.Room;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.MessageType;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.repository.ChatMessageRepository;
import com.vpt.arena.repository.ChatMuteRepository;
import com.vpt.arena.repository.DirectMessageRepository;
import com.vpt.arena.repository.FriendshipRepository;
import com.vpt.arena.repository.MessageReportRepository;
import com.vpt.arena.repository.RoomRepository;
import com.vpt.arena.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatService Unit Tests")
class ChatServiceTest {
    @Mock private ChatMessageRepository chatMessageRepository;
    @Mock private DirectMessageRepository directMessageRepository;
    @Mock private ChatMuteRepository chatMuteRepository;
    @Mock private MessageReportRepository messageReportRepository;
    @Mock private UserRepository userRepository;
    @Mock private RoomRepository roomRepository;
    @Mock private FriendshipRepository friendshipRepository;

    private ChatService chatService;
    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        chatService = new ChatService(
            chatMessageRepository,
            directMessageRepository,
            chatMuteRepository,
            messageReportRepository,
            userRepository,
            roomRepository,
            friendshipRepository
        );
        alice = user("Alice", Role.USER);
        bob = user("Bob", Role.USER);
    }

    @Test
    @DisplayName("Send global message lưu message text đã trim")
    void shouldSendGlobalMessage() {
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            message.setId(UUID.randomUUID());
            message.setCreatedAt(OffsetDateTime.now());
            return message;
        });

        ChatMessageDto dto = chatService.sendGlobal(alice.getId(), "  hello world  ");

        assertThat(dto.getChannel()).isEqualTo("GLOBAL");
        assertThat(dto.getMessage()).isEqualTo("hello world");
        assertThat(dto.getSenderId()).isEqualTo(alice.getId());
    }

    @Test
    @DisplayName("Global history ẩn message từ user đang bị mute")
    void shouldFilterMutedUsersFromGlobalHistory() {
        ChatMessage visible = chatMessage(alice, "visible");
        ChatMessage muted = chatMessage(bob, "muted");
        when(chatMuteRepository.findActiveMutedUserIds(eq(alice.getId()), any())).thenReturn(List.of(bob.getId()));
        when(chatMessageRepository.findGlobalMessages(eq(null), any(Pageable.class))).thenReturn(List.of(muted, visible));

        List<ChatMessageDto> history = chatService.globalHistory(alice.getId(), null, 50);

        assertThat(history).hasSize(1);
        assertThat(history.getFirst().getMessage()).isEqualTo("visible");
    }

    @Test
    @DisplayName("Không cho gửi DM cho chính mình")
    void shouldRejectDirectMessageToSelf() {
        assertThatThrownBy(() -> chatService.sendDirect(alice.getId(), alice.getId(), "hello"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Cannot send direct message to yourself");

        verify(directMessageRepository, never()).save(any());
    }

    @Test
    @DisplayName("Không cho gửi DM nếu chưa kết bạn")
    void shouldRejectDirectMessageWhenUsersAreNotFriends() {
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(userRepository.findById(bob.getId())).thenReturn(Optional.of(bob));
        when(friendshipRepository.existsByUserIdAndFriendId(alice.getId(), bob.getId())).thenReturn(false);

        assertThatThrownBy(() -> chatService.sendDirect(alice.getId(), bob.getId(), "hello"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Direct messages are only available between friends");

        verify(directMessageRepository, never()).save(any());
    }

    @Test
    @DisplayName("Owner có thể soft delete message của mình")
    void shouldDeleteOwnGlobalMessage() {
        ChatMessage message = chatMessage(alice, "hello");
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(chatMessageRepository.findById(message.getId())).thenReturn(Optional.of(message));

        chatService.delete(alice.getId(), "GLOBAL", message.getId());

        assertThat(message.getDeletedAt()).isNotNull();
        assertThat(message.getDeletedBy()).isEqualTo(alice);
        verify(chatMessageRepository).save(message);
    }

    @Test
    @DisplayName("User thường không được delete message của người khác")
    void shouldRejectDeletingOthersMessage() {
        ChatMessage message = chatMessage(bob, "hello");
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(chatMessageRepository.findById(message.getId())).thenReturn(Optional.of(message));

        assertThatThrownBy(() -> chatService.delete(alice.getId(), "GLOBAL", message.getId()))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Cannot delete this message");
    }

    @Test
    @DisplayName("Send room message yêu cầu room tồn tại")
    void shouldSendRoomMessage() {
        Room room = new Room();
        room.setId(UUID.randomUUID());
        room.setName("Battle Room");
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(roomRepository.findById(room.getId())).thenReturn(Optional.of(room));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(invocation -> {
            ChatMessage message = invocation.getArgument(0);
            message.setId(UUID.randomUUID());
            message.setCreatedAt(OffsetDateTime.now());
            return message;
        });

        ChatMessageDto dto = chatService.sendRoom(alice.getId(), room.getId(), "ready");

        assertThat(dto.getChannel()).isEqualTo("ROOM");
        assertThat(dto.getRoomId()).isEqualTo(room.getId());
    }

    private ChatMessage chatMessage(User user, String text) {
        ChatMessage message = new ChatMessage();
        message.setId(UUID.randomUUID());
        message.setUser(user);
        message.setMessage(text);
        message.setType(MessageType.TEXT);
        message.setCreatedAt(OffsetDateTime.now());
        return message;
    }

    @SuppressWarnings("unused")
    private DirectMessage directMessage(User sender, User receiver, String text) {
        DirectMessage message = new DirectMessage();
        message.setId(UUID.randomUUID());
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setMessage(text);
        message.setCreatedAt(OffsetDateTime.now());
        return message;
    }

    @SuppressWarnings("unused")
    private Problem problem(String title) {
        Problem problem = new Problem();
        problem.setId(UUID.randomUUID());
        problem.setTitle(title);
        return problem;
    }

    private User user(String name, Role role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setName(name);
        user.setEmail(name.toLowerCase() + "@example.com");
        user.setRole(role);
        user.setEmailVerified(true);
        return user;
    }
}
