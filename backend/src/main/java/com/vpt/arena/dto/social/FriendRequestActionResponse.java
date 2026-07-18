package com.vpt.arena.dto.social;

import com.vpt.arena.entity.enums.FriendRequestStatus;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class FriendRequestActionResponse {
    private UUID requestId;
    private FriendRequestStatus status;
    private UUID friendId;
    private boolean removed;
}
