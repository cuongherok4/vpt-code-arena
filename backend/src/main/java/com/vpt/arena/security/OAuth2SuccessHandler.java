package com.vpt.arena.security;

import com.vpt.arena.dto.auth.AuthResponse;
import com.vpt.arena.dto.auth.UserSummaryDto;
import com.vpt.arena.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
@ConditionalOnBean(AuthService.class)
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler {
    private final AuthService authService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {
        try {
            OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
            OAuth2User principal = token.getPrincipal();
            String provider = token.getAuthorizedClientRegistrationId();
            AuthResponse authResponse = authService.oauthLogin(
                provider,
                extractProviderId(provider, principal),
                extractEmail(principal),
                extractName(principal)
            );

            getRedirectStrategy().sendRedirect(request, response, successUrl(authResponse));
        } catch (ResponseStatusException e) {
            getRedirectStrategy().sendRedirect(request, response, errorUrl(e.getReason()));
        }
    }

    private String successUrl(AuthResponse response) {
        UserSummaryDto user = response.getUser();
        return UriComponentsBuilder.fromUriString(frontendUrl + "/auth/callback")
            .queryParam("accessToken", response.getAccessToken())
            .queryParam("refreshToken", response.getRefreshToken())
            .queryParam("expiresIn", response.getExpiresIn())
            .queryParam("userId", user.getId())
            .queryParam("publicId", user.getPublicId())
            .queryParam("email", user.getEmail())
            .queryParam("name", user.getName())
            .queryParam("role", user.getRole())
            .queryParam("emailVerified", user.isEmailVerified())
            .build()
            .encode(StandardCharsets.UTF_8)
            .toUriString();
    }

    private String errorUrl(String reason) {
        return UriComponentsBuilder.fromUriString(frontendUrl + "/login")
            .queryParam("oauthError", reason == null ? "OAuth login failed" : reason)
            .build()
            .encode(StandardCharsets.UTF_8)
            .toUriString();
    }

    private String extractProviderId(String provider, OAuth2User principal) {
        Object id = "github".equals(provider)
            ? principal.getAttribute("id")
            : principal.getAttribute("sub");
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "OAuth provider did not return an id");
        }
        return id.toString();
    }

    private String extractEmail(OAuth2User principal) {
        String email = principal.getAttribute("email");
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "OAuth provider did not return an email");
        }
        return email;
    }

    private String extractName(OAuth2User principal) {
        String name = principal.getAttribute("name");
        if (name == null || name.isBlank()) {
            name = principal.getAttribute("login");
        }
        return name;
    }
}
