package com.vpt.arena.dto.battle;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vpt.arena.entity.enums.Difficulty;
import com.vpt.arena.entity.enums.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BattleRoomDto {
    private UUID id;
    private String name;
    private RoomStatus status;
    @JsonProperty("isPublic")
    private boolean isPublic;
    private int maxMembers;
    private int numProblems;
    private int timeLimitMin;
    private Difficulty difficulty;
    private String topic;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private UUID creatorId;
    private String creatorName;
    private int memberCount;
    private List<BattleMemberDto> members;
    private List<BattleProblemDto> problems;
}
