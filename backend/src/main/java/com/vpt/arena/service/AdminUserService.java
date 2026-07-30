package com.vpt.arena.service;

import com.vpt.arena.dto.admin.AdminBanUserRequest;
import com.vpt.arena.dto.admin.AdminUserDto;
import com.vpt.arena.dto.admin.AdminUserListResponse;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.repository.UserRepository;
import com.vpt.arena.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminUserService {
    private static final int MAX_PAGE_SIZE = 100;

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public AdminUserListResponse listUsers(CustomUserDetails principal, String search, int page, int size) {
        requireAdmin(principal);
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        String normalizedSearch = search == null || search.isBlank() ? null : search.trim();
        Page<User> users = userRepository.searchForAdmin(normalizedSearch, PageRequest.of(safePage, safeSize));
        return new AdminUserListResponse(
            users.getContent().stream().map(this::toDto).toList(),
            users.getNumber(),
            users.getSize(),
            users.getTotalElements(),
            users.getTotalPages()
        );
    }

    @Transactional
    public AdminUserDto updateBanStatus(CustomUserDetails principal, UUID userId, AdminBanUserRequest request) {
        requireAdmin(principal);
        if (principal.getId().equals(userId) && Boolean.TRUE.equals(request.getBanned())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin cannot ban self");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setBanned(Boolean.TRUE.equals(request.getBanned()));
        return toDto(userRepository.save(user));
    }

    private void requireAdmin(CustomUserDetails principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        boolean admin = principal.getAuthorities().stream()
            .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + Role.ADMIN.name()));
        if (!admin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
        }
    }

    private AdminUserDto toDto(User user) {
        return AdminUserDto.builder()
            .id(user.getId())
            .publicId(user.getPublicId())
            .email(user.getEmail())
            .name(user.getName())
            .role(user.getRole())
            .emailVerified(user.isEmailVerified())
            .banned(user.isBanned())
            .oauthProvider(user.getOauthProvider())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }
}
