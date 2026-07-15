package com.vpt.arena.controller;

import com.vpt.arena.dto.exam.ExamSubmitRequest;
import com.vpt.arena.dto.exam.ExamLeaderboardEntryDto;
import com.vpt.arena.dto.exam.JudgeResultRequest;
import com.vpt.arena.dto.exam.SubmissionDto;
import com.vpt.arena.service.ExamJudgeWorker;
import com.vpt.arena.service.LeaderboardService;
import com.vpt.arena.service.SubmissionService;
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
@RequiredArgsConstructor
@Tag(name = "Exam Module", description = "APIs for Exam Module")
public class ExamController {

    private final SubmissionService submissionService;
    private final ExamJudgeWorker examJudgeWorker;
    private final LeaderboardService leaderboardService;

    @PostMapping("/api/v1/exam/problems/{problemId}/submissions")
    @Operation(summary = "Submit code for an exam problem asynchronously")
    public ResponseEntity<SubmissionDto> submit(
            @PathVariable UUID problemId,
            @Valid @RequestBody ExamSubmitRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        SubmissionDto submission = submissionService.submit(requireUserId(userIdStr), problemId, request);
        examJudgeWorker.judgeSubmission(submission.getId());
        return ResponseEntity.accepted().body(submission);
    }

    @GetMapping("/api/v1/exam/problems/{problemId}/submissions")
    @Operation(summary = "Get recent submissions for a problem")
    public ResponseEntity<List<SubmissionDto>> history(
            @PathVariable UUID problemId,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        return ResponseEntity.ok(submissionService.history(requireUserId(userIdStr), problemId));
    }

    @GetMapping("/api/v1/exam/problems/{problemId}/leaderboard")
    @Operation(summary = "Get cached leaderboard for an exam problem")
    public ResponseEntity<List<ExamLeaderboardEntryDto>> leaderboard(
            @PathVariable UUID problemId,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(leaderboardService.getExamLeaderboard(problemId, limit));
    }

    @GetMapping("/api/v1/exam/leaderboard")
    @Operation(summary = "Get cached exam leaderboard")
    public ResponseEntity<List<ExamLeaderboardEntryDto>> leaderboardByQuery(
            @RequestParam UUID problemId,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(leaderboardService.getExamLeaderboard(problemId, limit));
    }

    @PostMapping("/internal/judge-result")
    @Operation(summary = "Internal endpoint to apply judge result")
    public ResponseEntity<SubmissionDto> applyJudgeResult(@Valid @RequestBody JudgeResultRequest request) {
        return ResponseEntity.ok(submissionService.applyJudgeResult(request));
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
