package com.vpt.arena.controller;

import com.vpt.arena.dto.battle.BattleRoomCreateRequest;
import com.vpt.arena.dto.battle.BattleRoomDto;
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
