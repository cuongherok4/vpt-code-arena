package com.vpt.arena.dto.learn;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RunCodeResponse {
    private String stdout;
    private String stderr;
    private String compileOutput;
    private String status;
    private String expectedOutput;
    private Boolean passed;
    private String time;      // execution time (seconds)
    private String memory;    // memory usage (KB)
}
