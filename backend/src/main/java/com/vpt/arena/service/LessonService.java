package com.vpt.arena.service;

import com.vpt.arena.dto.learn.LessonDetailDto;
import com.vpt.arena.entity.Lesson;
import com.vpt.arena.repository.LessonRepository;
import com.vpt.arena.repository.UserProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepository lessonRepository;
    private final UserProgressRepository userProgressRepository;

    @Transactional(readOnly = true)
    public LessonDetailDto getLesson(UUID lessonId, UUID userId) {
        Lesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

        LessonDetailDto dto = new LessonDetailDto();
        dto.setId(lesson.getId());
        dto.setChapterId(lesson.getChapter().getId());
        dto.setTitle(lesson.getTitle());
        dto.setContent(lesson.getContent());
        dto.setOrder(lesson.getOrder());
        dto.setHasChallenge(lesson.isHasChallenge());
        dto.setChallengeDescription(lesson.getChallengeDescription());

        if (userId != null) {
            userProgressRepository.findByUserIdAndLessonId(userId, lessonId).ifPresent(p -> {
                dto.setCompleted(p.isCompleted());
                dto.setChallengePassed(p.isChallengePassed());
            });
        }

        return dto;
    }
}
