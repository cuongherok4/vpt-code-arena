package com.vpt.arena.service;

import com.vpt.arena.dto.admin.AdminStatsDto;
import com.vpt.arena.entity.enums.RoomStatus;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.repository.BattleSubmissionRepository;
import com.vpt.arena.repository.ProblemRepository;
import com.vpt.arena.repository.RoomRepository;
import com.vpt.arena.repository.SubmissionRepository;
import com.vpt.arena.repository.UserRepository;
import com.vpt.arena.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminStatsService {
    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UserRepository userRepository;
    private final ProblemRepository problemRepository;
    private final SubmissionRepository submissionRepository;
    private final BattleSubmissionRepository battleSubmissionRepository;
    private final RoomRepository roomRepository;

    @Transactional(readOnly = true)
    public AdminStatsDto overview(CustomUserDetails principal) {
        requireAdmin(principal);
        OffsetDateTime start = OffsetDateTime.now(APP_ZONE).toLocalDate().atStartOfDay(APP_ZONE).toOffsetDateTime();
        OffsetDateTime end = start.plusDays(1);

        return AdminStatsDto.builder()
            .totalUsers(userRepository.count())
            .activeUsersToday(submissionRepository.countActiveUsersBetween(start, end))
            .totalProblems(problemRepository.count())
            .publishedProblems(problemRepository.countByIsPublishedTrue())
            .totalSubmissions(submissionRepository.count() + battleSubmissionRepository.count())
            .totalBattleRooms(roomRepository.countByStatusIn(List.of(RoomStatus.WAITING, RoomStatus.IN_PROGRESS)))
            .build();
    }

    private void requireAdmin(CustomUserDetails principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        boolean admin = principal.getAuthorities().stream()
            .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + Role.ADMIN.name()));
        if (!admin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
        }
    }
}
