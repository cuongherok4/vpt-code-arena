package com.vpt.arena.service;

import com.vpt.arena.dto.learn.ChapterDto;
import com.vpt.arena.dto.learn.LessonDto;
import com.vpt.arena.entity.UserProgress;
import com.vpt.arena.repository.ChapterRepository;
import com.vpt.arena.repository.UserProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChapterService {

    private final ChapterRepository chapterRepository;
    private final UserProgressRepository userProgressRepository;

    @Transactional(readOnly = true)
    public List<ChapterDto> getAllChaptersWithProgress(UUID userId) {
        // JOIN FETCH lessons — 1 query duy nhất, không N+1
        var chapters = chapterRepository.findAllWithLessons();

        // Nếu có user: load toàn bộ progress 1 lần, group theo lessonId
        Map<UUID, UserProgress> progressMap = userId != null
            ? userProgressRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(p -> p.getLesson().getId(), p -> p, (a, b) -> a))
            : Map.of();

        return chapters.stream().map(chapter -> {
            ChapterDto dto = new ChapterDto();
            dto.setId(chapter.getId());
            dto.setTitle(chapter.getTitle());
            dto.setDescription(chapter.getDescription());
            dto.setOrder(chapter.getOrder());
            dto.setGroupName(chapter.getGroupName());
            dto.setLessons(chapter.getLessons().stream()
                .sorted((a, b) -> a.getOrder().compareTo(b.getOrder()))
                .map(lesson -> {
                    LessonDto lDto = new LessonDto();
                    lDto.setId(lesson.getId());
                    lDto.setTitle(lesson.getTitle());
                    lDto.setOrder(lesson.getOrder());
                    lDto.setHasChallenge(lesson.isHasChallenge());
                    UserProgress p = progressMap.get(lesson.getId());
                    if (p != null) {
                        lDto.setCompleted(p.isCompleted());
                        lDto.setChallengePassed(p.isChallengePassed());
                    }
                    return lDto;
                }).collect(Collectors.toList()));
            return dto;
        }).collect(Collectors.toList());
    }
}
