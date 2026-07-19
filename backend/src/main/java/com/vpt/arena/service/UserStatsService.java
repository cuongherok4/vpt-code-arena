package com.vpt.arena.service;

import com.vpt.arena.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserStatsService {

    private final UserStatsRepository userStatsRepository;

    @Async
    @Transactional
    public void refreshAfterAccepted(UUID userId) {
        try {
            userStatsRepository.refreshForUser(userId);
        } catch (RuntimeException e) {
            log.warn("Could not refresh user stats for {}: {}", userId, e.getMessage());
        }
    }
}
