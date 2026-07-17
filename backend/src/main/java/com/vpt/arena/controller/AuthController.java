package com.vpt.arena.controller;

import com.vpt.arena.dto.auth.AuthResponse;
import com.vpt.arena.dto.auth.ForgotPasswordRequest;
import com.vpt.arena.dto.auth.LoginRequest;
import com.vpt.arena.dto.auth.LogoutRequest;
import com.vpt.arena.dto.auth.RefreshTokenRequest;
import com.vpt.arena.dto.auth.RegisterRequest;
import com.vpt.arena.dto.auth.ResetPasswordRequest;
import com.vpt.arena.dto.auth.VerifyEmailRequest;
import com.vpt.arena.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "JWT email/password authentication")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register with email and password")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token and issue a new access token")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request.getRefreshToken()));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke the current refresh token")
    public ResponseEntity<Map<String, String>> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email by token")
    public ResponseEntity<Map<String, String>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request.getToken());
        return ResponseEntity.ok(Map.of("message", "Email verified"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Send password reset email if the account exists")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "If the email exists, a reset link has been sent"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password by token")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getPassword());
        return ResponseEntity.ok(Map.of("message", "Password reset"));
    }
}
