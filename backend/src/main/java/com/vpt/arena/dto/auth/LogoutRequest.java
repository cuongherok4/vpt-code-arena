package com.vpt.arena.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LogoutRequest {
    @NotBlank(message = "refreshToken is required")
    private String refreshToken;
}
