package com.vpt.arena.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BattleScheduler {

    private final BattleJudgeService battleJudgeService;

    @Scheduled(fixedDelayString = "${battle.scheduler.finish-expired-delay-ms:30000}")
    public void finishExpiredRooms() {
        int finished = battleJudgeService.finishExpiredRooms();
        if (finished > 0) {
            log.info("Finished {} expired battle room(s)", finished);
        }
    }
}
