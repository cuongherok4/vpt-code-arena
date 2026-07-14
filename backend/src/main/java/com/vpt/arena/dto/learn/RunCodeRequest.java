package com.vpt.arena.dto.learn;

import lombok.Data;

@Data
public class RunCodeRequest {
    private String sourceCode;
    private Integer languageId;
}
