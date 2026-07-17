package com.vpt.arena.service;

import com.vpt.arena.dto.auth.AuthResponse;
import com.vpt.arena.dto.auth.LoginRequest;
import com.vpt.arena.dto.auth.RegisterRequest;
import com.vpt.arena.entity.EmailVerifyToken;
import com.vpt.arena.entity.PasswordResetToken;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.repository.EmailVerifyTokenRepository;
import com.vpt.arena.repository.PasswordResetTokenRepository;
import com.vpt.arena.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private EmailVerifyTokenRepository emailVerifyTokenRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private EmailService emailService;

    private AuthService authService;
    private JwtService jwtService;
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        jwtService = new JwtService(
            "defaultSecretKeyThatIsAtLeast64CharactersLongSoThatItWorksProperlyForDevEnvironment1234567890",
            900,
            7
        );
        authService = new AuthService(
            userRepository,
            passwordEncoder,
            jwtService,
            refreshTokenService,
            emailVerifyTokenRepository,
            passwordResetTokenRepository,
            emailService
        );
    }

    @Test
    @DisplayName("Register tạo user và trả token")
    void shouldRegisterAndIssueTokens() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Alice");
        request.setEmail("Alice@Example.com");
        request.setPassword("StrongPass123");

        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });
        when(emailVerifyTokenRepository.save(any(EmailVerifyToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = authService.register(request);

        assertThat(response.getAccessToken()).isNotBlank();
        assertThat(response.getRefreshToken()).isNotBlank();
        assertThat(response.getUser().getEmail()).isEqualTo("alice@example.com");
        assertThat(response.getUser().getRole()).isEqualTo(Role.USER);
        assertThat(response.getUser().isEmailVerified()).isFalse();
        verify(emailService).sendVerificationEmail(any(), any());
        verify(refreshTokenService).save(response.getUser().getId(), response.getRefreshToken());
    }

    @Test
    @DisplayName("Register reject email trùng")
    void shouldRejectDuplicateEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Alice");
        request.setEmail("alice@example.com");
        request.setPassword("StrongPass123");
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Email already exists");
    }

    @Test
    @DisplayName("Login kiểm tra mật khẩu BCrypt")
    void shouldLoginWithPassword() {
        User user = user(UUID.randomUUID(), passwordEncoder.encode("StrongPass123"));
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));

        LoginRequest request = new LoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("StrongPass123");

        AuthResponse response = authService.login(request);

        assertThat(response.getAccessToken()).isNotBlank();
        assertThat(response.getUser().getId()).isEqualTo(user.getId());
        verify(refreshTokenService).save(user.getId(), response.getRefreshToken());
    }

    @Test
    @DisplayName("Login reject mật khẩu sai")
    void shouldRejectBadPassword() {
        User user = user(UUID.randomUUID(), passwordEncoder.encode("StrongPass123"));
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));

        LoginRequest request = new LoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("wrong-password");

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("Login reject email chưa xác thực")
    void shouldRejectUnverifiedEmail() {
        User user = user(UUID.randomUUID(), passwordEncoder.encode("StrongPass123"));
        user.setEmailVerified(false);
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));

        LoginRequest request = new LoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("StrongPass123");

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Email is not verified");
    }

    @Test
    @DisplayName("Refresh token rotate và lưu token mới")
    void shouldRefreshAndRotateToken() {
        User user = user(UUID.randomUUID(), passwordEncoder.encode("StrongPass123"));
        String refreshToken = jwtService.generateRefreshToken(user);
        when(refreshTokenService.matches(user.getId(), refreshToken)).thenReturn(true);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        AuthResponse response = authService.refresh(refreshToken);

        assertThat(response.getAccessToken()).isNotBlank();
        assertThat(response.getRefreshToken()).isNotEqualTo(refreshToken);
        verify(refreshTokenService).save(user.getId(), response.getRefreshToken());
    }

    @Test
    @DisplayName("OAuth login tạo user mới và verify email")
    void shouldCreateOAuthUser() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        AuthResponse response = authService.oauthLogin("google", "google-123", "Alice@Example.com", "Alice OAuth");

        assertThat(response.getUser().getEmail()).isEqualTo("alice@example.com");
        assertThat(response.getUser().isEmailVerified()).isTrue();
        assertThat(response.getAccessToken()).isNotBlank();
        verify(refreshTokenService).save(response.getUser().getId(), response.getRefreshToken());
    }

    @Test
    @DisplayName("OAuth login cập nhật user hiện có")
    void shouldUpdateExistingOAuthUser() {
        User user = user(UUID.randomUUID(), passwordEncoder.encode("StrongPass123"));
        user.setEmailVerified(false);
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthResponse response = authService.oauthLogin("github", "42", "alice@example.com", "Alice GitHub");

        assertThat(response.getUser().getName()).isEqualTo("Alice GitHub");
        assertThat(response.getUser().isEmailVerified()).isTrue();
        assertThat(user.getOauthProvider()).isEqualTo("github");
        assertThat(user.getOauthId()).isEqualTo("42");
    }

    @Test
    @DisplayName("Logout revoke refresh token")
    void shouldLogoutAndRevokeRefreshToken() {
        User user = user(UUID.randomUUID(), passwordEncoder.encode("StrongPass123"));
        String refreshToken = jwtService.generateRefreshToken(user);

        authService.logout(refreshToken);

        verify(refreshTokenService).revoke(user.getId());
    }

    @Test
    @DisplayName("Verify email cập nhật user và xóa token")
    void shouldVerifyEmail() {
        User user = user(UUID.randomUUID(), passwordEncoder.encode("StrongPass123"));
        user.setEmailVerified(false);
        EmailVerifyToken token = new EmailVerifyToken();
        token.setUser(user);
        token.setToken("verify-token");
        token.setExpiresAt(OffsetDateTime.now().plusHours(1));
        when(emailVerifyTokenRepository.findByToken("verify-token")).thenReturn(Optional.of(token));

        authService.verifyEmail("verify-token");

        assertThat(user.isEmailVerified()).isTrue();
        verify(userRepository).save(user);
        verify(emailVerifyTokenRepository).deleteByUser(user);
    }

    @Test
    @DisplayName("Forgot password tạo reset token nếu email tồn tại")
    void shouldCreatePasswordResetToken() {
        User user = user(UUID.randomUUID(), passwordEncoder.encode("StrongPass123"));
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.forgotPassword("Alice@Example.com");

        ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isEqualTo(user);
        assertThat(captor.getValue().getToken()).isNotBlank();
        verify(emailService).sendPasswordResetEmail(user.getEmail(), captor.getValue().getToken());
    }

    @Test
    @DisplayName("Forgot password không lộ email không tồn tại")
    void shouldIgnoreUnknownForgotPasswordEmail() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        authService.forgotPassword("missing@example.com");

        verify(passwordResetTokenRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetEmail(any(), any());
    }

    @Test
    @DisplayName("Reset password đổi mật khẩu và revoke refresh token")
    void shouldResetPassword() {
        User user = user(UUID.randomUUID(), passwordEncoder.encode("OldPass123"));
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken("reset-token");
        token.setExpiresAt(OffsetDateTime.now().plusMinutes(30));
        when(passwordResetTokenRepository.findByToken("reset-token")).thenReturn(Optional.of(token));

        authService.resetPassword("reset-token", "NewPass123");

        assertThat(passwordEncoder.matches("NewPass123", user.getPasswordHash())).isTrue();
        assertThat(user.isEmailVerified()).isTrue();
        assertThat(token.getUsedAt()).isNotNull();
        verify(userRepository).save(user);
        verify(passwordResetTokenRepository).save(token);
        verify(refreshTokenService).revoke(user.getId());
    }

    private User user(UUID id, String passwordHash) {
        User user = new User();
        user.setId(id);
        user.setEmail("alice@example.com");
        user.setName("Alice");
        user.setRole(Role.USER);
        user.setPasswordHash(passwordHash);
        user.setEmailVerified(true);
        user.setBanned(false);
        return user;
    }
}
