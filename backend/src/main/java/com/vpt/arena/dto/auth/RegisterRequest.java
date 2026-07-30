package com.vpt.arena.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @Email(message = "email must be valid")
    @NotBlank(message = "email is required")
    private String email;

    @NotBlank(message = "password is required")
    @Size(min = 8, message = "password must be at least 8 characters")
    private String password;

    @NotBlank(message = "name is required")
    @Size(max = 100, message = "name must be at most 100 characters")
    private String name;
}
