package com.vpt.arena.controller;

import com.vpt.arena.dto.leaderboard.GlobalLeaderboardEntryDto;
import com.vpt.arena.service.LeaderboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/leaderboard")
@Tag(name = "Leaderboard", description = "Global leaderboard APIs")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping("/global")
    @Operation(summary = "Get cached global leaderboard")
    public ResponseEntity<List<GlobalLeaderboardEntryDto>> global(
            @RequestParam(defaultValue = "all") String type,
            @RequestParam(required = false) String language,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(leaderboardService.getGlobalLeaderboard(type, language, limit));
    }
}
