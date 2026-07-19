package com.vpt.arena.dto.admin;

import com.vpt.arena.entity.enums.Role;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class AdminUserDto {
    private UUID id;
    private String publicId;
    private String email;
    private String name;
    private Role role;
    private boolean emailVerified;
    private boolean banned;
    private String oauthProvider;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
