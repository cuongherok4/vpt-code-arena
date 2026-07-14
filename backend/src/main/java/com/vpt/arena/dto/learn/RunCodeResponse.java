package com.vpt.arena.dto.learn;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class RunCodeResponse {
    private String stdout;
    private String stderr;
    private String compileOutput;
    private String status;
    private String expectedOutput;
    private Boolean passed;
}
