package com.vpt.arena.service;

import com.vpt.arena.dto.auth.AuthResponse;
import com.vpt.arena.dto.auth.LoginRequest;
import com.vpt.arena.dto.auth.RegisterRequest;
import com.vpt.arena.dto.auth.UserSummaryDto;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setName(request.getName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);
        user.setEmailVerified(false);
        user.setBanned(false);

        return issueTokens(userRepository.save(user));
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (user.isBanned()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is banned");
        }
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.isRefreshToken(refreshToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        UUID userId = jwtService.extractUserId(refreshToken);
        if (!refreshTokenService.matches(userId, refreshToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token has been revoked");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        if (user.isBanned()) {
            refreshTokenService.revoke(userId);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is banned");
        }

        return issueTokens(user);
    }

    public void logout(String refreshToken) {
        if (jwtService.isRefreshToken(refreshToken)) {
            refreshTokenService.revoke(jwtService.extractUserId(refreshToken));
        }
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        refreshTokenService.save(user.getId(), refreshToken);
        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .expiresIn(jwtService.getAccessExpirySeconds())
            .user(toSummary(user))
            .build();
    }

    private UserSummaryDto toSummary(User user) {
        return UserSummaryDto.builder()
            .id(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .role(user.getRole())
            .emailVerified(user.isEmailVerified())
            .build();
    }

    private String normalizeEmail(String email) {
        return email.toLowerCase().trim();
    }
}
