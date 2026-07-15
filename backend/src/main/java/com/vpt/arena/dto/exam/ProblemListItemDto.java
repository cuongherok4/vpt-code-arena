package com.vpt.arena.dto.exam;

import com.vpt.arena.entity.enums.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProblemListItemDto {
    private UUID id;
    private String title;
    private Difficulty difficulty;
    private String topic;
    private int timeLimitMs;
    private int memoryLimitKb;
}
