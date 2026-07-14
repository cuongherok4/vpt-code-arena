package com.vpt.arena.dto.learn;

import lombok.Data;
import java.util.UUID;
import java.util.List;

@Data
public class ChapterDto {
    private UUID id;
    private String title;
    private String description;
    private Integer order;
    private String groupName;
    private List<LessonDto> lessons;
}
