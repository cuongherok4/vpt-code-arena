package com.vpt.arena.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExamJudgeWorker {

    private final SubmissionService submissionService;

    @Async
    public void judgeSubmission(UUID submissionId) {
        try {
            submissionService.judgeSubmission(submissionId);
        } catch (Exception e) {
            log.error("Async exam judging failed for submission {}: {}", submissionId, e.getMessage(), e);
            submissionService.markJudgeFailure(submissionId, e.getMessage());
        }
    }
}
