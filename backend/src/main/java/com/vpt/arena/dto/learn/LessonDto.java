package com.vpt.arena.dto.learn;

import lombok.Data;
import java.util.UUID;

@Data
public class LessonDto {
    private UUID id;
    private String title;
    private Integer order;
    private boolean hasChallenge;
    private boolean completed;
    private boolean challengePassed;
}
