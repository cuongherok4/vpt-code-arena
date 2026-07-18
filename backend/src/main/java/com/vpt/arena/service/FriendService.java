package com.vpt.arena.service;

import com.vpt.arena.dto.social.FriendDto;
import com.vpt.arena.dto.social.FriendRequestActionResponse;
import com.vpt.arena.dto.social.FriendRequestDto;
import com.vpt.arena.dto.social.FriendRequestsResponse;
import com.vpt.arena.dto.social.UserSearchResultDto;
import com.vpt.arena.entity.FriendRequest;
import com.vpt.arena.entity.Friendship;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.FriendRequestStatus;
import com.vpt.arena.repository.FriendRequestRepository;
import com.vpt.arena.repository.FriendshipRepository;
import com.vpt.arena.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FriendService {
    private static final int SEARCH_LIMIT = 20;

    private final UserRepository userRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;

    @Transactional(readOnly = true)
    public List<UserSearchResultDto> searchUsers(UUID currentUserId, String query) {
        String normalized = normalizeQuery(query);
        Map<UUID, User> candidates = new LinkedHashMap<>();
        parseUuid(normalized)
            .flatMap(userRepository::findById)
            .filter(user -> !user.getId().equals(currentUserId))
            .ifPresent(user -> candidates.put(user.getId(), user));
        userRepository.searchForFriends(currentUserId, normalized, PageRequest.of(0, SEARCH_LIMIT))
            .forEach(user -> candidates.putIfAbsent(user.getId(), user));

        return candidates.values().stream()
            .limit(SEARCH_LIMIT)
            .map(user -> toSearchDto(currentUserId, user))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<FriendDto> friends(UUID currentUserId) {
        return friendshipRepository.findByUserIdOrderByCreatedAtDesc(currentUserId).stream()
            .map(friendship -> toFriendDto(friendship.getFriend(), friendship.getCreatedAt()))
            .toList();
    }

    @Transactional(readOnly = true)
    public FriendRequestsResponse requests(UUID currentUserId) {
        List<FriendRequestDto> incoming = friendRequestRepository
            .findByReceiverIdAndStatusOrderByCreatedAtDesc(currentUserId, FriendRequestStatus.PENDING).stream()
            .map(request -> toRequestDto(request, request.getSender()))
            .toList();
        List<FriendRequestDto> outgoing = friendRequestRepository
            .findBySenderIdAndStatusOrderByCreatedAtDesc(currentUserId, FriendRequestStatus.PENDING).stream()
            .map(request -> toRequestDto(request, request.getReceiver()))
            .toList();
        return FriendRequestsResponse.builder()
            .incoming(incoming)
            .outgoing(outgoing)
            .build();
    }

    @Transactional
    public FriendRequestActionResponse sendRequest(UUID senderId, UUID receiverId) {
        if (senderId.equals(receiverId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot send friend request to yourself");
        }
        if (friendshipRepository.existsByUserIdAndFriendId(senderId, receiverId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already friends");
        }
        if (friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(senderId, receiverId, FriendRequestStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Friend request already pending");
        }
        if (friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(receiverId, senderId, FriendRequestStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Incoming friend request already pending");
        }

        FriendRequest request = friendRequestRepository.findBySenderIdAndReceiverId(senderId, receiverId)
            .orElseGet(FriendRequest::new);
        request.setSender(findUser(senderId));
        request.setReceiver(findUser(receiverId));
        request.setStatus(FriendRequestStatus.PENDING);
        FriendRequest saved = friendRequestRepository.save(request);
        return FriendRequestActionResponse.builder()
            .requestId(saved.getId())
            .status(saved.getStatus())
            .build();
    }

    @Transactional
    public FriendRequestActionResponse acceptRequest(UUID currentUserId, UUID requestId) {
        FriendRequest request = findRequest(requestId);
        ensureReceiver(currentUserId, request);
        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Friend request is not pending");
        }

        request.setStatus(FriendRequestStatus.ACCEPTED);
        friendRequestRepository.save(request);
        createFriendshipIfMissing(request.getReceiver(), request.getSender());
        createFriendshipIfMissing(request.getSender(), request.getReceiver());

        return FriendRequestActionResponse.builder()
            .requestId(request.getId())
            .status(request.getStatus())
            .friendId(request.getSender().getId())
            .build();
    }

    @Transactional
    public FriendRequestActionResponse rejectRequest(UUID currentUserId, UUID requestId) {
        FriendRequest request = findRequest(requestId);
        ensureReceiver(currentUserId, request);
        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Friend request is not pending");
        }
        request.setStatus(FriendRequestStatus.REJECTED);
        friendRequestRepository.save(request);
        return FriendRequestActionResponse.builder()
            .requestId(request.getId())
            .status(request.getStatus())
            .build();
    }

    @Transactional
    public FriendRequestActionResponse removeFriend(UUID currentUserId, UUID friendId) {
        if (currentUserId.equals(friendId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot remove yourself");
        }
        if (!friendshipRepository.existsByUserIdAndFriendId(currentUserId, friendId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Friendship not found");
        }
        friendshipRepository.deleteByUserIdAndFriendId(currentUserId, friendId);
        friendshipRepository.deleteByUserIdAndFriendId(friendId, currentUserId);
        return FriendRequestActionResponse.builder()
            .friendId(friendId)
            .removed(true)
            .build();
    }

    private void createFriendshipIfMissing(User user, User friend) {
        if (friendshipRepository.existsByUserIdAndFriendId(user.getId(), friend.getId())) {
            return;
        }
        Friendship friendship = new Friendship();
        friendship.setUser(user);
        friendship.setFriend(friend);
        friendshipRepository.save(friendship);
    }

    private FriendRequest findRequest(UUID requestId) {
        return friendRequestRepository.findWithUsersById(requestId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Friend request not found"));
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void ensureReceiver(UUID currentUserId, FriendRequest request) {
        if (!request.getReceiver().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot manage this friend request");
        }
    }

    private UserSearchResultDto toSearchDto(UUID currentUserId, User user) {
        return UserSearchResultDto.builder()
            .id(user.getId())
            .name(user.getName())
            .email(maskEmail(user.getEmail()))
            .friendStatus(friendStatus(currentUserId, user.getId()))
            .build();
    }

    private FriendDto toFriendDto(User user, OffsetDateTime friendsSince) {
        return FriendDto.builder()
            .id(user.getId())
            .name(user.getName())
            .email(maskEmail(user.getEmail()))
            .avatar(null)
            .online(false)
            .friendsSince(friendsSince)
            .build();
    }

    private FriendRequestDto toRequestDto(FriendRequest request, User user) {
        return FriendRequestDto.builder()
            .requestId(request.getId())
            .user(UserSearchResultDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(maskEmail(user.getEmail()))
                .friendStatus(null)
                .build())
            .createdAt(request.getCreatedAt())
            .build();
    }

    private String friendStatus(UUID currentUserId, UUID targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            return "SELF";
        }
        if (friendshipRepository.existsByUserIdAndFriendId(currentUserId, targetUserId)) {
            return "FRIENDS";
        }
        if (friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(currentUserId, targetUserId, FriendRequestStatus.PENDING)) {
            return "PENDING_OUTGOING";
        }
        if (friendRequestRepository.existsBySenderIdAndReceiverIdAndStatus(targetUserId, currentUserId, FriendRequestStatus.PENDING)) {
            return "PENDING_INCOMING";
        }
        return "NONE";
    }

    private String normalizeQuery(String query) {
        if (query == null || query.trim().length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Search query must contain at least 2 characters");
        }
        return query.trim();
    }

    private java.util.Optional<UUID> parseUuid(String value) {
        try {
            return java.util.Optional.of(UUID.fromString(value));
        } catch (IllegalArgumentException e) {
            return java.util.Optional.empty();
        }
    }

    private String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        int at = email.indexOf('@');
        if (at <= 1) {
            return "***" + (at >= 0 ? email.substring(at) : "");
        }
        return email.charAt(0) + "***" + email.substring(at);
    }
}
