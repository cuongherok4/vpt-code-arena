package com.vpt.arena.dto.admin;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminBanUserRequest {
    @NotNull
    private Boolean banned;

    @Size(max = 255)
    private String reason;
}
