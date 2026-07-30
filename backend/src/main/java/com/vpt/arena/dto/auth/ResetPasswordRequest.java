package com.vpt.arena.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordRequest {
    @NotBlank(message = "token is required")
    private String token;

    @NotBlank(message = "password is required")
    @Size(min = 8, message = "password must be at least 8 characters")
    private String password;
}
