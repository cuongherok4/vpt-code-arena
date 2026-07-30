package com.vpt.arena.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @Email(message = "email must be valid")
    @NotBlank(message = "email is required")
    private String email;

    @NotBlank(message = "password is required")
    private String password;
}
