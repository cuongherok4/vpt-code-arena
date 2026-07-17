package com.vpt.arena.controller;

import com.vpt.arena.dto.battle.BattleRoomCreateRequest;
import com.vpt.arena.dto.battle.BattleRoomDto;
import com.vpt.arena.dto.battle.BattleLeaderboardEntryDto;
import com.vpt.arena.dto.battle.BattleSubmissionDto;
import com.vpt.arena.dto.battle.BattleSubmitRequest;
import com.vpt.arena.service.BattleJudgeService;
import com.vpt.arena.service.BattleJudgeWorker;
import com.vpt.arena.service.BattleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/battle")
@Tag(name = "Battle Module", description = "APIs for Battle room lifecycle")
public class BattleController {

    private final BattleService battleService;
    private final BattleJudgeService battleJudgeService;
    private final BattleJudgeWorker battleJudgeWorker;

    @GetMapping("/rooms")
    @Operation(summary = "List public waiting battle rooms")
    public ResponseEntity<List<BattleRoomDto>> rooms() {
        return ResponseEntity.ok(battleService.listPublicWaitingRooms());
    }

    @GetMapping("/rooms/{roomId}")
    @Operation(summary = "Get battle room detail")
    public ResponseEntity<BattleRoomDto> room(@PathVariable UUID roomId) {
        return ResponseEntity.ok(battleService.getRoom(roomId));
    }

    @PostMapping("/rooms")
    @Operation(summary = "Create a battle room")
    public ResponseEntity<BattleRoomDto> create(
            @Valid @RequestBody BattleRoomCreateRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        return ResponseEntity.status(HttpStatus.CREATED).body(battleService.createRoom(requireUserId(userIdStr), request));
    }

    @PostMapping("/rooms/{roomId}/join")
    @Operation(summary = "Join a waiting battle room")
    public ResponseEntity<BattleRoomDto> join(
            @PathVariable UUID roomId,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        return ResponseEntity.ok(battleService.joinRoom(roomId, requireUserId(userIdStr)));
    }

    @PutMapping("/rooms/{roomId}")
    @Operation(summary = "Update a waiting battle room")
    public ResponseEntity<BattleRoomDto> update(
            @PathVariable UUID roomId,
            @Valid @RequestBody BattleRoomCreateRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        return ResponseEntity.ok(battleService.updateRoom(roomId, requireUserId(userIdStr), request));
    }

    @DeleteMapping("/rooms/{roomId}")
    @Operation(summary = "Delete a waiting battle room")
    public ResponseEntity<Void> delete(
            @PathVariable UUID roomId,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        battleService.deleteRoom(roomId, requireUserId(userIdStr));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/rooms/{roomId}/start")
    @Operation(summary = "Start a battle room")
    public ResponseEntity<BattleRoomDto> start(
            @PathVariable UUID roomId,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        return ResponseEntity.ok(battleService.startRoom(roomId, requireUserId(userIdStr)));
    }

    @PostMapping({"/rooms/{roomId}/submissions", "/rooms/{roomId}/submit"})
    @Operation(summary = "Submit code in a battle room asynchronously")
    public ResponseEntity<BattleSubmissionDto> submit(
            @PathVariable UUID roomId,
            @Valid @RequestBody BattleSubmitRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        BattleSubmissionDto submission = battleJudgeService.submit(roomId, requireUserId(userIdStr), request);
        battleJudgeWorker.judgeSubmission(submission.getId());
        return ResponseEntity.accepted().body(submission);
    }

    @GetMapping("/rooms/{roomId}/leaderboard")
    @Operation(summary = "Get battle leaderboard")
    public ResponseEntity<List<BattleLeaderboardEntryDto>> leaderboard(@PathVariable UUID roomId) {
        return ResponseEntity.ok(battleJudgeService.leaderboard(roomId));
    }

    @PostMapping("/rooms/{roomId}/finish")
    @Operation(summary = "Finish a battle room")
    public ResponseEntity<List<BattleLeaderboardEntryDto>> finish(
            @PathVariable UUID roomId,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        return ResponseEntity.ok(battleJudgeService.finishRoomAsUser(roomId, requireUserId(userIdStr)));
    }

    private UUID requireUserId(String userIdStr) {
        if (userIdStr == null || userIdStr.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        try {
            return UUID.fromString(userIdStr);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
    }
}
