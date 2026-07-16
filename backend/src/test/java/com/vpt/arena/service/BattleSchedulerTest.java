package com.vpt.arena.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("BattleScheduler Unit Tests")
class BattleSchedulerTest {

    @Mock private BattleJudgeService battleJudgeService;

    @InjectMocks
    private BattleScheduler battleScheduler;

    @Test
    @DisplayName("Gọi service finish expired rooms")
    void shouldCallFinishExpiredRooms() {
        when(battleJudgeService.finishExpiredRooms()).thenReturn(2);

        battleScheduler.finishExpiredRooms();

        verify(battleJudgeService).finishExpiredRooms();
    }
}
