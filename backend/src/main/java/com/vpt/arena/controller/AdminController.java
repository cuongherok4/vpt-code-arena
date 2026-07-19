package com.vpt.arena.controller;

import com.vpt.arena.dto.admin.AdminBanUserRequest;
import com.vpt.arena.dto.admin.AdminUserDto;
import com.vpt.arena.dto.admin.AdminUserListResponse;
import com.vpt.arena.security.CustomUserDetails;
import com.vpt.arena.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin", description = "Admin-only management APIs")
public class AdminController {
    private final AdminUserService adminUserService;

    @GetMapping("/users")
    @Operation(summary = "List users for admin")
    public AdminUserListResponse users(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminUserService.listUsers(principal, search, page, size);
    }

    @PutMapping("/users/{userId}/ban")
    @Operation(summary = "Ban or unban a user")
    public AdminUserDto banUser(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID userId,
            @Valid @RequestBody AdminBanUserRequest request) {
        return adminUserService.updateBanStatus(principal, userId, request);
    }
}
