package com.vpt.arena.dto.admin;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminStatsDto {
    private long totalUsers;
    private long activeUsersToday;
    private long totalProblems;
    private long publishedProblems;
    private long totalSubmissions;
    private long totalBattleRooms;
}
