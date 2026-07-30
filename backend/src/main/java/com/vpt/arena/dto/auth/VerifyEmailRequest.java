package com.vpt.arena.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyEmailRequest {
    @NotBlank(message = "token is required")
    private String token;
}
