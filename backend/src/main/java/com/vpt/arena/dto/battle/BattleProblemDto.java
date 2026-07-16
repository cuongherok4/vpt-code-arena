package com.vpt.arena.dto.battle;

import com.vpt.arena.entity.enums.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BattleProblemDto {
    private UUID id;
    private String title;
    private Difficulty difficulty;
    private String topic;
    private int order;
}
