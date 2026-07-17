package com.vpt.arena.service;

import com.vpt.arena.dto.user.UpdateProfileRequest;
import com.vpt.arena.dto.user.UserProfileDto;
import com.vpt.arena.dto.user.UserSubmissionHistoryDto;
import com.vpt.arena.entity.BattleSubmission;
import com.vpt.arena.entity.Submission;
import com.vpt.arena.entity.User;
import com.vpt.arena.repository.BattleSubmissionRepository;
import com.vpt.arena.repository.SubmissionRepository;
import com.vpt.arena.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class UserProfileService {
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final BattleSubmissionRepository battleSubmissionRepository;

    @Transactional(readOnly = true)
    public UserProfileDto getProfile(UUID userId) {
        return toProfile(findUser(userId));
    }

    @Transactional
    public UserProfileDto updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = findUser(userId);
        user.setName(request.getName().trim());
        return toProfile(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserSubmissionHistoryDto> getHistory(UUID userId) {
        PageRequest limit = PageRequest.of(0, 20);
        Stream<UserSubmissionHistoryDto> exam = submissionRepository.findRecentByUserId(userId, limit)
            .stream()
            .map(this::toHistory);
        Stream<UserSubmissionHistoryDto> battle = battleSubmissionRepository.findRecentByUserId(userId, limit)
            .stream()
            .map(this::toHistory);

        return Stream.concat(exam, battle)
            .sorted(Comparator.comparing(UserSubmissionHistoryDto::getSubmittedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .limit(20)
            .toList();
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserProfileDto toProfile(User user) {
        return UserProfileDto.builder()
            .id(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .role(user.getRole())
            .emailVerified(user.isEmailVerified())
            .oauthProvider(user.getOauthProvider())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }

    private UserSubmissionHistoryDto toHistory(Submission submission) {
        return UserSubmissionHistoryDto.builder()
            .id(submission.getId())
            .type("EXAM")
            .problemId(submission.getProblem().getId())
            .problemTitle(submission.getProblem().getTitle())
            .language(submission.getLanguage())
            .result(submission.getResult())
            .points(submission.getPoints())
            .executionTime(submission.getExecutionTime())
            .submittedAt(submission.getSubmittedAt())
            .build();
    }

    private UserSubmissionHistoryDto toHistory(BattleSubmission submission) {
        return UserSubmissionHistoryDto.builder()
            .id(submission.getId())
            .type("BATTLE")
            .problemId(submission.getProblem().getId())
            .problemTitle(submission.getProblem().getTitle())
            .roomId(submission.getRoom().getId())
            .roomName(submission.getRoom().getName())
            .language(submission.getLanguage())
            .result(submission.getResult())
            .points(submission.getPoints())
            .executionTime(submission.getExecutionTime())
            .submittedAt(submission.getSubmittedAt())
            .build();
    }
}
