package com.vpt.arena.dto.chat;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportMessageRequest {
    @Size(max = 500, message = "reason must be at most 500 characters")
    private String reason;
}
