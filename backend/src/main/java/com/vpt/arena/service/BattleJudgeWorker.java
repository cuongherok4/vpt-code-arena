package com.vpt.arena.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class BattleJudgeWorker {

    private final BattleJudgeService battleJudgeService;

    @Async
    public void judgeSubmission(UUID submissionId) {
        try {
            battleJudgeService.judgeSubmission(submissionId);
        } catch (Exception e) {
            log.error("Async battle judging failed for submission {}: {}", submissionId, e.getMessage(), e);
            battleJudgeService.markJudgeFailure(submissionId, e.getMessage());
        }
    }
}
