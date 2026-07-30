package com.vpt.arena.dto.user;

import com.vpt.arena.entity.enums.Role;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class UserProfileDto {
    private UUID id;
    private String publicId;
    private String email;
    private String name;
    private Role role;
    private boolean emailVerified;
    private String oauthProvider;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
