package com.vpt.arena.controller;

import com.vpt.arena.dto.learn.ChapterDto;
import com.vpt.arena.dto.learn.LessonDetailDto;
import com.vpt.arena.dto.learn.RunCodeRequest;
import com.vpt.arena.dto.learn.RunCodeResponse;
import com.vpt.arena.service.ChapterService;
import com.vpt.arena.service.LessonService;
import com.vpt.arena.service.ProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learn")
@RequiredArgsConstructor
@Tag(name = "Learn Module", description = "APIs for Learn Module")
public class LearnController {

    private final ChapterService chapterService;
    private final LessonService lessonService;
    private final ProgressService progressService;

    /** Parse userId — null nếu không có (guest). */
    private UUID parseUserId(String userIdStr) {
        if (userIdStr == null || userIdStr.isBlank()) return null;
        try { return UUID.fromString(userIdStr); }
        catch (IllegalArgumentException e) { return null; }
    }

    /** Parse userId, throw 401 nếu không có (chỉ dùng cho write endpoints). */
    private UUID requireUserId(String userIdStr) {
        UUID id = parseUserId(userIdStr);
        if (id == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        return id;
    }

    @GetMapping("/chapters")
    @Operation(summary = "Get all chapters with lessons and progress")
    public ResponseEntity<List<ChapterDto>> getChapters(
            @RequestParam(defaultValue = "java") String language,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        return ResponseEntity.ok(chapterService.getAllChaptersWithProgress(parseUserId(userIdStr), language));
    }

    @GetMapping("/lessons/{id}")
    @Operation(summary = "Get lesson detail with progress state")
    public ResponseEntity<LessonDetailDto> getLesson(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        return ResponseEntity.ok(lessonService.getLesson(id, parseUserId(userIdStr)));
    }

    @PostMapping("/lessons/{id}/complete")
    @Operation(summary = "Mark lesson as completed — requires auth")
    public ResponseEntity<Void> completeLesson(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        progressService.markCompleted(requireUserId(userIdStr), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/lessons/{id}/challenge")
    @Operation(summary = "Submit code challenge — saves progress if passed")
    public ResponseEntity<RunCodeResponse> submitChallenge(
            @PathVariable UUID id,
            @Valid @RequestBody RunCodeRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        return ResponseEntity.ok(progressService.submitChallenge(parseUserId(userIdStr), id, request));
    }

    @PostMapping("/run-code")
    @Operation(summary = "Run code freely — no auth needed")
    public ResponseEntity<RunCodeResponse> runCode(@Valid @RequestBody RunCodeRequest request) {
        return ResponseEntity.ok(progressService.runCode(request, null));
    }
}
