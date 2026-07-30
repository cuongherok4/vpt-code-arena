package com.vpt.arena.service;

import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("JwtService Unit Tests")
class JwtServiceTest {
    private JwtService jwtService;
    private User user;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(
            "defaultSecretKeyThatIsAtLeast64CharactersLongSoThatItWorksProperlyForDevEnvironment1234567890",
            900,
            7
        );
        user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("alice@example.com");
        user.setName("Alice");
        user.setRole(Role.USER);
        user.setPasswordHash("hash");
        user.setEmailVerified(true);
    }

    @Test
    @DisplayName("Access token chứa claims và validate đúng user")
    void shouldGenerateValidAccessToken() {
        String token = jwtService.generateAccessToken(user);

        assertThat(jwtService.extractUserId(token)).isEqualTo(user.getId());
        assertThat(jwtService.extractEmail(token)).isEqualTo(user.getEmail());
        assertThat(jwtService.extractClaims(token).get("type", String.class)).isEqualTo("access");
        assertThat(jwtService.isAccessTokenValid(token, new CustomUserDetails(user))).isTrue();
    }

    @Test
    @DisplayName("Refresh token không được coi là access token")
    void shouldRejectRefreshTokenAsAccessToken() {
        String token = jwtService.generateRefreshToken(user);

        assertThat(jwtService.isRefreshToken(token)).isTrue();
        assertThat(jwtService.isAccessTokenValid(token, new CustomUserDetails(user))).isFalse();
    }
}
