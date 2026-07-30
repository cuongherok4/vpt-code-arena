package com.vpt.arena.dto.social;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class FriendRequestsResponse {
    private List<FriendRequestDto> incoming;
    private List<FriendRequestDto> outgoing;
}
