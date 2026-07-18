package com.vpt.arena.dto.social;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class UserSearchResultDto {
    private UUID id;
    private String publicId;
    private String name;
    private String email;
    private String friendStatus;
}
