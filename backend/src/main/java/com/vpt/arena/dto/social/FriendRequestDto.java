package com.vpt.arena.dto.social;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class FriendRequestDto {
    private UUID requestId;
    private UserSearchResultDto user;
    private OffsetDateTime createdAt;
}
