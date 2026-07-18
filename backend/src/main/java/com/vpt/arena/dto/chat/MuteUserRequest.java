package com.vpt.arena.dto.chat;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MuteUserRequest {
    @Min(value = 1, message = "minutes must be at least 1")
    @Max(value = 43200, message = "minutes must be at most 43200")
    private Integer minutes;
}
