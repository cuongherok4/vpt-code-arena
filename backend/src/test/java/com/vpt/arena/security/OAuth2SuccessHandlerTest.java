package com.vpt.arena.security;

import com.vpt.arena.dto.auth.AuthResponse;
import com.vpt.arena.dto.auth.UserSummaryDto;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("OAuth2SuccessHandler Unit Tests")
class OAuth2SuccessHandlerTest {

    @Test
    @DisplayName("OAuth success upsert user và redirect về FE callback")
    void shouldRedirectToFrontendCallback() throws Exception {
        AuthService authService = mock(AuthService.class);
        OAuth2SuccessHandler handler = new OAuth2SuccessHandler(authService);
        ReflectionTestUtils.setField(handler, "frontendUrl", "http://localhost:5173");
        when(authService.oauthLogin("google", "google-123", "alice@example.com", "Alice"))
            .thenReturn(authResponse());

        MockHttpServletResponse response = new MockHttpServletResponse();
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), response, token(Map.of(
            "sub", "google-123",
            "email", "alice@example.com",
            "name", "Alice"
        )));

        assertThat(response.getRedirectedUrl()).startsWith("http://localhost:5173/auth/callback?");
        assertThat(response.getRedirectedUrl()).contains("accessToken=access-token");
    }

    @Test
    @DisplayName("OAuth lỗi nghiệp vụ redirect về login kèm oauthError")
    void shouldRedirectToLoginOnBusinessError() throws Exception {
        AuthService authService = mock(AuthService.class);
        OAuth2SuccessHandler handler = new OAuth2SuccessHandler(authService);
        ReflectionTestUtils.setField(handler, "frontendUrl", "http://localhost:5173");
        when(authService.oauthLogin("google", "google-123", "alice@example.com", "Alice"))
            .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is banned"));

        MockHttpServletResponse response = new MockHttpServletResponse();
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), response, token(Map.of(
            "sub", "google-123",
            "email", "alice@example.com",
            "name", "Alice"
        )));

        assertThat(response.getRedirectedUrl()).startsWith("http://localhost:5173/login?");
        assertThat(response.getRedirectedUrl()).contains("oauthError=Account%20is%20banned");
    }

    private OAuth2AuthenticationToken token(Map<String, Object> attributes) {
        OAuth2User user = new DefaultOAuth2User(
            List.of(new SimpleGrantedAuthority("ROLE_USER")),
            attributes,
            "sub"
        );
        return new OAuth2AuthenticationToken(user, user.getAuthorities(), "google");
    }

    private AuthResponse authResponse() {
        return AuthResponse.builder()
            .accessToken("access-token")
            .refreshToken("refresh-token")
            .expiresIn(900)
            .user(UserSummaryDto.builder()
                .id(UUID.randomUUID())
                .email("alice@example.com")
                .name("Alice")
                .role(Role.USER)
                .emailVerified(true)
                .build())
            .build();
    }
}
