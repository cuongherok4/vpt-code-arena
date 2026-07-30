package com.vpt.arena.dto.auth;

import com.vpt.arena.entity.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserSummaryDto {
    private UUID id;
    private String publicId;
    private String email;
    private String name;
    private Role role;
    private boolean emailVerified;
}
