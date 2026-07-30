package com.vpt.arena.service;

import com.vpt.arena.dto.social.FriendRequestActionResponse;
import com.vpt.arena.dto.social.UserSearchResultDto;
import com.vpt.arena.entity.FriendRequest;
import com.vpt.arena.entity.Friendship;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.FriendRequestStatus;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.repository.FriendRequestRepository;
import com.vpt.arena.repository.FriendshipRepository;
import com.vpt.arena.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("FriendService Unit Tests")
class FriendServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private FriendRequestRepository friendRequestRepository;
    @Mock private FriendshipRepository friendshipRepository;

    private FriendService friendService;
    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        friendService = new FriendService(userRepository, friendRequestRepository, friendshipRepository);
        alice = user("Alice");
        bob = user("Bob");
    }

    @Test
    @DisplayName("Gửi friend request tạo trạng thái PENDING")
    void shouldSendFriendRequest() {
        when(friendshipRepository.existsByUserIdAndFriendId(alice.getId(), bob.getId())).thenReturn(false);
        when(friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(alice.getId(), bob.getId(), FriendRequestStatus.PENDING)).thenReturn(false);
        when(friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(bob.getId(), alice.getId(), FriendRequestStatus.PENDING)).thenReturn(false);
        when(friendRequestRepository.findBySenderIdAndReceiverId(alice.getId(), bob.getId())).thenReturn(Optional.empty());
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(userRepository.findById(bob.getId())).thenReturn(Optional.of(bob));
        when(friendRequestRepository.save(any(FriendRequest.class))).thenAnswer(invocation -> {
            FriendRequest request = invocation.getArgument(0);
            request.setId(UUID.randomUUID());
            return request;
        });

        FriendRequestActionResponse response = friendService.sendRequest(alice.getId(), bob.getId());

        assertThat(response.getStatus()).isEqualTo(FriendRequestStatus.PENDING);
        assertThat(response.getRequestId()).isNotNull();
    }

    @Test
    @DisplayName("Không cho tự kết bạn")
    void shouldRejectSelfRequest() {
        assertThatThrownBy(() -> friendService.sendRequest(alice.getId(), alice.getId()))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Cannot send friend request to yourself");

        verify(friendRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("Không tạo request trùng khi đang PENDING")
    void shouldRejectDuplicatePendingRequest() {
        when(friendshipRepository.existsByUserIdAndFriendId(alice.getId(), bob.getId())).thenReturn(false);
        when(friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(alice.getId(), bob.getId(), FriendRequestStatus.PENDING)).thenReturn(true);

        assertThatThrownBy(() -> friendService.sendRequest(alice.getId(), bob.getId()))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Friend request already pending");
    }

    @Test
    @DisplayName("Accept request tạo friendship hai chiều")
    void shouldAcceptRequestAndCreateFriendships() {
        FriendRequest request = request(alice, bob, FriendRequestStatus.PENDING);
        when(friendRequestRepository.findWithUsersById(request.getId())).thenReturn(Optional.of(request));
        when(friendshipRepository.existsByUserIdAndFriendId(bob.getId(), alice.getId())).thenReturn(false);
        when(friendshipRepository.existsByUserIdAndFriendId(alice.getId(), bob.getId())).thenReturn(false);

        FriendRequestActionResponse response = friendService.acceptRequest(bob.getId(), request.getId());

        assertThat(response.getStatus()).isEqualTo(FriendRequestStatus.ACCEPTED);
        assertThat(response.getFriendId()).isEqualTo(alice.getId());
        verify(friendRequestRepository).save(request);
        ArgumentCaptor<Friendship> friendshipCaptor = ArgumentCaptor.forClass(Friendship.class);
        verify(friendshipRepository, times(2)).save(friendshipCaptor.capture());
        assertThat(friendshipCaptor.getAllValues())
            .extracting(friendship -> friendship.getUser().getId() + ":" + friendship.getFriend().getId())
            .containsExactlyInAnyOrder(
                bob.getId() + ":" + alice.getId(),
                alice.getId() + ":" + bob.getId()
            );
    }

    @Test
    @DisplayName("User không phải receiver không được accept request")
    void shouldRejectManagingOthersRequest() {
        FriendRequest request = request(alice, bob, FriendRequestStatus.PENDING);
        User charlie = user("Charlie");
        when(friendRequestRepository.findWithUsersById(request.getId())).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> friendService.acceptRequest(charlie.getId(), request.getId()))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Cannot manage this friend request");
    }

    @Test
    @DisplayName("Reject request đổi status thành REJECTED")
    void shouldRejectRequest() {
        FriendRequest request = request(alice, bob, FriendRequestStatus.PENDING);
        when(friendRequestRepository.findWithUsersById(request.getId())).thenReturn(Optional.of(request));

        FriendRequestActionResponse response = friendService.rejectRequest(bob.getId(), request.getId());

        assertThat(response.getStatus()).isEqualTo(FriendRequestStatus.REJECTED);
        verify(friendRequestRepository).save(request);
    }

    @Test
    @DisplayName("Remove friend xóa quan hệ hai chiều")
    void shouldRemoveFriend() {
        when(friendshipRepository.existsByUserIdAndFriendId(alice.getId(), bob.getId())).thenReturn(true);

        FriendRequestActionResponse response = friendService.removeFriend(alice.getId(), bob.getId());

        assertThat(response.isRemoved()).isTrue();
        verify(friendshipRepository).deleteByUserIdAndFriendId(alice.getId(), bob.getId());
        verify(friendshipRepository).deleteByUserIdAndFriendId(bob.getId(), alice.getId());
    }

    @Test
    @DisplayName("Search user trả friendStatus theo quan hệ hiện tại")
    void shouldSearchUsersWithFriendStatus() {
        when(userRepository.searchForFriends(eq(alice.getId()), eq("bo"), any(Pageable.class))).thenReturn(List.of(bob));
        when(friendshipRepository.existsByUserIdAndFriendId(alice.getId(), bob.getId())).thenReturn(true);

        List<UserSearchResultDto> results = friendService.searchUsers(alice.getId(), " bo ");

        assertThat(results).hasSize(1);
        assertThat(results.getFirst().getId()).isEqualTo(bob.getId());
        assertThat(results.getFirst().getFriendStatus()).isEqualTo("FRIENDS");
        assertThat(results.getFirst().getEmail()).isEqualTo("b***@example.com");
    }

    private FriendRequest request(User sender, User receiver, FriendRequestStatus status) {
        FriendRequest request = new FriendRequest();
        request.setId(UUID.randomUUID());
        request.setSender(sender);
        request.setReceiver(receiver);
        request.setStatus(status);
        request.setCreatedAt(OffsetDateTime.now());
        return request;
    }

    private User user(String name) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setName(name);
        user.setEmail(name.toLowerCase() + "@example.com");
        user.setRole(Role.USER);
        user.setEmailVerified(true);
        return user;
    }
}
