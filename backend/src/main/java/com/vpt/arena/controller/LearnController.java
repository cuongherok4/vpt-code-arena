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
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    // TODO: Phase 5 Auth - Replace this with SecurityContext UUID
    private UUID getUserId(String userIdStr) {
        if (userIdStr != null && !userIdStr.isEmpty()) return UUID.fromString(userIdStr);
        return null;
    }

    @GetMapping("/chapters")
    @Operation(summary = "Get all chapters with progress")
    public ResponseEntity<List<ChapterDto>> getChapters(@RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        return ResponseEntity.ok(chapterService.getAllChaptersWithProgress(getUserId(userIdStr)));
    }

    @GetMapping("/lessons/{id}")
    @Operation(summary = "Get lesson details")
    public ResponseEntity<LessonDetailDto> getLesson(@PathVariable UUID id, @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        return ResponseEntity.ok(lessonService.getLesson(id, getUserId(userIdStr)));
    }

    @PostMapping("/lessons/{id}/complete")
    @Operation(summary = "Mark lesson as completed")
    public ResponseEntity<Void> completeLesson(@PathVariable UUID id, @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        progressService.markCompleted(getUserId(userIdStr), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/lessons/{id}/challenge")
    @Operation(summary = "Submit code challenge for a lesson")
    public ResponseEntity<RunCodeResponse> submitChallenge(@PathVariable UUID id, @RequestBody RunCodeRequest request, @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        return ResponseEntity.ok(progressService.submitChallenge(getUserId(userIdStr), id, request));
    }

    @PostMapping("/run-code")
    @Operation(summary = "Run code freely")
    public ResponseEntity<RunCodeResponse> runCode(@RequestBody RunCodeRequest request) {
        return ResponseEntity.ok(progressService.runCode(request, null));
    }
}
