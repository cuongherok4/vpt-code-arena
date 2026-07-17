package com.vpt.arena.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ForgotPasswordRequest {
    @Email(message = "email must be valid")
    @NotBlank(message = "email is required")
    private String email;
}
