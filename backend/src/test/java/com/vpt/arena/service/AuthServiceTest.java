package com.vpt.arena.service;

import com.vpt.arena.dto.auth.AuthResponse;
import com.vpt.arena.dto.auth.LoginRequest;
import com.vpt.arena.dto.auth.RegisterRequest;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenService refreshTokenService;

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
        authService = new AuthService(userRepository, passwordEncoder, jwtService, refreshTokenService);
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

        AuthResponse response = authService.register(request);

        assertThat(response.getAccessToken()).isNotBlank();
        assertThat(response.getRefreshToken()).isNotBlank();
        assertThat(response.getUser().getEmail()).isEqualTo("alice@example.com");
        assertThat(response.getUser().getRole()).isEqualTo(Role.USER);
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
    @DisplayName("Logout revoke refresh token")
    void shouldLogoutAndRevokeRefreshToken() {
        User user = user(UUID.randomUUID(), passwordEncoder.encode("StrongPass123"));
        String refreshToken = jwtService.generateRefreshToken(user);

        authService.logout(refreshToken);

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
