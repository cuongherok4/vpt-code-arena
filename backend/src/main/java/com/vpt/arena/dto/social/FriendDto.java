package com.vpt.arena.dto.social;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class FriendDto {
    private UUID id;
    private String name;
    private String email;
    private String avatar;
    private boolean online;
    private OffsetDateTime friendsSince;
}
