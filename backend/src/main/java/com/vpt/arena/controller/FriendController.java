package com.vpt.arena.controller;

import com.vpt.arena.dto.social.FriendDto;
import com.vpt.arena.dto.social.FriendRequestActionResponse;
import com.vpt.arena.dto.social.FriendRequestsResponse;
import com.vpt.arena.dto.social.UserSearchResultDto;
import com.vpt.arena.security.CustomUserDetails;
import com.vpt.arena.service.FriendService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
@Tag(name = "Friends", description = "User search, friend requests, and friendships")
public class FriendController {
    private final FriendService friendService;

    @GetMapping("/users/search")
    @Operation(summary = "Search users by name, email, or UUID for friend requests")
    public List<UserSearchResultDto> searchUsers(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam("q") String query) {
        return friendService.searchUsers(requirePrincipal(principal).getId(), query);
    }

    @GetMapping("/friends")
    @Operation(summary = "Get current user's friends")
    public List<FriendDto> friends(@AuthenticationPrincipal CustomUserDetails principal) {
        return friendService.friends(requirePrincipal(principal).getId());
    }

    @GetMapping("/friends/requests")
    @Operation(summary = "Get incoming and outgoing friend requests")
    public FriendRequestsResponse requests(@AuthenticationPrincipal CustomUserDetails principal) {
        return friendService.requests(requirePrincipal(principal).getId());
    }

    @PostMapping("/friends/requests/{userId}")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Send a friend request")
    public FriendRequestActionResponse sendRequest(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID userId) {
        return friendService.sendRequest(requirePrincipal(principal).getId(), userId);
    }

    @PostMapping("/friends/requests/{requestId}/accept")
    @Operation(summary = "Accept an incoming friend request")
    public FriendRequestActionResponse acceptRequest(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID requestId) {
        return friendService.acceptRequest(requirePrincipal(principal).getId(), requestId);
    }

    @PostMapping("/friends/requests/{requestId}/reject")
    @Operation(summary = "Reject an incoming friend request")
    public FriendRequestActionResponse rejectRequest(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID requestId) {
        return friendService.rejectRequest(requirePrincipal(principal).getId(), requestId);
    }

    @DeleteMapping("/friends/{userId}")
    @Operation(summary = "Remove a friend")
    public FriendRequestActionResponse removeFriend(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID userId) {
        return friendService.removeFriend(requirePrincipal(principal).getId(), userId);
    }

    private CustomUserDetails requirePrincipal(CustomUserDetails principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal;
    }
}
