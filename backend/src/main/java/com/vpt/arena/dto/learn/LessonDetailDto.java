package com.vpt.arena.dto.learn;

import lombok.Data;
import java.util.UUID;

@Data
public class LessonDetailDto {
    private UUID id;
    private UUID chapterId;   // để FE breadcrumb / navigate
    private String title;
    private String content;
    private Integer order;
    private boolean hasChallenge;
    private String challengeDescription;
    private boolean completed;
    private boolean challengePassed;
}
