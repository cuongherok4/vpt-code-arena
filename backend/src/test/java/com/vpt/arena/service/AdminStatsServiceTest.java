package com.vpt.arena.service;

import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.RoomStatus;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.repository.BattleSubmissionRepository;
import com.vpt.arena.repository.ProblemRepository;
import com.vpt.arena.repository.RoomRepository;
import com.vpt.arena.repository.SubmissionRepository;
import com.vpt.arena.repository.UserRepository;
import com.vpt.arena.security.CustomUserDetails;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminStatsService Unit Tests")
class AdminStatsServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private ProblemRepository problemRepository;
    @Mock private SubmissionRepository submissionRepository;
    @Mock private BattleSubmissionRepository battleSubmissionRepository;
    @Mock private RoomRepository roomRepository;

    @Test
    @DisplayName("Admin xem thống kê tổng quan")
    void shouldReturnOverviewForAdmin() {
        AdminStatsService service = service();
        when(userRepository.count()).thenReturn(10L);
        when(problemRepository.count()).thenReturn(20L);
        when(problemRepository.countByIsPublishedTrue()).thenReturn(15L);
        when(submissionRepository.count()).thenReturn(100L);
        when(battleSubmissionRepository.count()).thenReturn(40L);
        when(roomRepository.countByStatusIn(argThat(statuses ->
            statuses.contains(RoomStatus.WAITING) && statuses.contains(RoomStatus.IN_PROGRESS) && !statuses.contains(RoomStatus.FINISHED)
        ))).thenReturn(7L);
        when(submissionRepository.countActiveUsersBetween(any(OffsetDateTime.class), any(OffsetDateTime.class))).thenReturn(3L);

        var result = service.overview(principal(Role.ADMIN));

        assertThat(result.getTotalUsers()).isEqualTo(10);
        assertThat(result.getActiveUsersToday()).isEqualTo(3);
        assertThat(result.getTotalProblems()).isEqualTo(20);
        assertThat(result.getPublishedProblems()).isEqualTo(15);
        assertThat(result.getTotalSubmissions()).isEqualTo(140);
        assertThat(result.getTotalBattleRooms()).isEqualTo(7);
    }

    @Test
    @DisplayName("User thường không được xem stats admin")
    void shouldRejectNonAdmin() {
        AdminStatsService service = service();

        assertThatThrownBy(() -> service.overview(principal(Role.USER)))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Admin role required");
    }

    private AdminStatsService service() {
        return new AdminStatsService(
            userRepository,
            problemRepository,
            submissionRepository,
            battleSubmissionRepository,
            roomRepository
        );
    }

    private CustomUserDetails principal(Role role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(role.name().toLowerCase() + "@example.com");
        user.setName(role.name());
        user.setRole(role);
        return new CustomUserDetails(user);
    }
}
