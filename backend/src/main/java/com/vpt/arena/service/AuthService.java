package com.vpt.arena.service;

import com.vpt.arena.dto.auth.AuthResponse;
import com.vpt.arena.dto.auth.LoginRequest;
import com.vpt.arena.dto.auth.RegisterRequest;
import com.vpt.arena.dto.auth.UserSummaryDto;
import com.vpt.arena.entity.EmailVerifyToken;
import com.vpt.arena.entity.PasswordResetToken;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.repository.EmailVerifyTokenRepository;
import com.vpt.arena.repository.PasswordResetTokenRepository;
import com.vpt.arena.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final EmailVerifyTokenRepository emailVerifyTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

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

        User savedUser = userRepository.save(user);
        String token = createEmailVerifyToken(savedUser);
        emailService.sendVerificationEmail(savedUser.getEmail(), token);
        return issueTokens(savedUser);
    }

    @Transactional
    public AuthResponse oauthLogin(String provider, String providerId, String email, String name) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail)
            .map(existing -> updateOAuthUser(existing, provider, providerId, name))
            .orElseGet(() -> createOAuthUser(provider, providerId, normalizedEmail, name));

        if (user.isBanned()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is banned");
        }

        return issueTokens(userRepository.save(user));
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (user.isBanned()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is banned");
        }
        if (!user.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email is not verified");
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

    @Transactional
    public void verifyEmail(String token) {
        EmailVerifyToken verifyToken = emailVerifyTokenRepository.findByToken(token)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification token"));
        if (verifyToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification token has expired");
        }

        User user = verifyToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        emailVerifyTokenRepository.deleteByUser(user);
    }

    @Transactional
    public void forgotPassword(String email) {
        userRepository.findByEmail(normalizeEmail(email)).ifPresent(user -> {
            if (user.isBanned()) {
                return;
            }
            passwordResetTokenRepository.deleteByUserAndUsedAtIsNull(user);
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUser(user);
            resetToken.setToken(generateToken());
            resetToken.setExpiresAt(OffsetDateTime.now().plusMinutes(30));
            passwordResetTokenRepository.save(resetToken);
            emailService.sendPasswordResetEmail(user.getEmail(), resetToken.getToken());
        });
    }

    @Transactional
    public void resetPassword(String token, String password) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid reset token"));
        if (resetToken.getUsedAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token has already been used");
        }
        if (resetToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token has expired");
        }

        User user = resetToken.getUser();
        if (user.isBanned()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is banned");
        }

        user.setPasswordHash(passwordEncoder.encode(password));
        user.setEmailVerified(true);
        userRepository.save(user);
        resetToken.setUsedAt(OffsetDateTime.now());
        passwordResetTokenRepository.save(resetToken);
        refreshTokenService.revoke(user.getId());
    }

    public AuthResponse issueTokens(User user) {
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

    private String createEmailVerifyToken(User user) {
        emailVerifyTokenRepository.deleteByUser(user);
        EmailVerifyToken verifyToken = new EmailVerifyToken();
        verifyToken.setUser(user);
        verifyToken.setToken(generateToken());
        verifyToken.setExpiresAt(OffsetDateTime.now().plusHours(24));
        return emailVerifyTokenRepository.save(verifyToken).getToken();
    }

    private String generateToken() {
        return UUID.randomUUID().toString() + UUID.randomUUID();
    }

    private User updateOAuthUser(User user, String provider, String providerId, String name) {
        user.setOauthProvider(provider);
        user.setOauthId(providerId);
        user.setEmailVerified(true);
        if (name != null && !name.isBlank()) {
            user.setName(name.trim());
        }
        return user;
    }

    private User createOAuthUser(String provider, String providerId, String email, String name) {
        User user = new User();
        user.setEmail(email);
        user.setName(name == null || name.isBlank() ? email.substring(0, email.indexOf('@')) : name.trim());
        user.setRole(Role.USER);
        user.setEmailVerified(true);
        user.setBanned(false);
        user.setOauthProvider(provider);
        user.setOauthId(providerId);
        return user;
    }
}
