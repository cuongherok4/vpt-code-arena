package com.vpt.arena.controller;

import com.vpt.arena.dto.admin.AdminBanUserRequest;
import com.vpt.arena.dto.admin.AdminProblemDto;
import com.vpt.arena.dto.admin.AdminProblemListResponse;
import com.vpt.arena.dto.admin.AdminProblemRequest;
import com.vpt.arena.dto.admin.AdminStatsDto;
import com.vpt.arena.dto.admin.AdminUserDto;
import com.vpt.arena.dto.admin.AdminUserListResponse;
import com.vpt.arena.entity.enums.Difficulty;
import com.vpt.arena.security.CustomUserDetails;
import com.vpt.arena.service.AdminProblemService;
import com.vpt.arena.service.AdminStatsService;
import com.vpt.arena.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin", description = "Admin-only management APIs")
public class AdminController {
    private final AdminUserService adminUserService;
    private final AdminProblemService adminProblemService;
    private final AdminStatsService adminStatsService;

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

    @GetMapping("/problems")
    @Operation(summary = "List problems for admin")
    public AdminProblemListResponse problems(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) Boolean published,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminProblemService.listProblems(principal, search, difficulty, published, page, size);
    }

    @GetMapping("/problems/{problemId}")
    @Operation(summary = "Get problem detail for admin")
    public AdminProblemDto problem(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID problemId) {
        return adminProblemService.getProblem(principal, problemId);
    }

    @PostMapping("/problems")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create problem")
    public AdminProblemDto createProblem(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody AdminProblemRequest request) {
        return adminProblemService.createProblem(principal, request);
    }

    @PutMapping("/problems/{problemId}")
    @Operation(summary = "Update problem")
    public AdminProblemDto updateProblem(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID problemId,
            @Valid @RequestBody AdminProblemRequest request) {
        return adminProblemService.updateProblem(principal, problemId, request);
    }

    @DeleteMapping("/problems/{problemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete problem")
    public void deleteProblem(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID problemId) {
        adminProblemService.deleteProblem(principal, problemId);
    }

    @GetMapping("/stats")
    @Operation(summary = "Get admin system stats")
    public AdminStatsDto stats(@AuthenticationPrincipal CustomUserDetails principal) {
        return adminStatsService.overview(principal);
    }
}
