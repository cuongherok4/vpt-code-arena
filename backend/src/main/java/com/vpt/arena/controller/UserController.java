package com.vpt.arena.controller;

import com.vpt.arena.dto.user.UpdateProfileRequest;
import com.vpt.arena.dto.user.UserProfileDto;
import com.vpt.arena.dto.user.UserSubmissionHistoryDto;
import com.vpt.arena.security.CustomUserDetails;
import com.vpt.arena.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "Current user profile and activity")
public class UserController {
    private final UserProfileService userProfileService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public UserProfileDto me(@AuthenticationPrincipal CustomUserDetails principal) {
        return userProfileService.getProfile(requirePrincipal(principal).getId());
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public UserProfileDto updateMe(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        return userProfileService.updateProfile(requirePrincipal(principal).getId(), request);
    }

    @GetMapping("/me/history")
    @Operation(summary = "Get current user submission history")
    public List<UserSubmissionHistoryDto> history(@AuthenticationPrincipal CustomUserDetails principal) {
        return userProfileService.getHistory(requirePrincipal(principal).getId());
    }

    private CustomUserDetails requirePrincipal(CustomUserDetails principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal;
    }
}
