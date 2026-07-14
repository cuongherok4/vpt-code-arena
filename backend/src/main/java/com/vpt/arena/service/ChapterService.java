package com.vpt.arena.service;

import com.vpt.arena.dto.learn.ChapterDto;
import com.vpt.arena.dto.learn.LessonDto;
import com.vpt.arena.entity.Chapter;
import com.vpt.arena.entity.UserProgress;
import com.vpt.arena.repository.ChapterRepository;
import com.vpt.arena.repository.UserProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
public class ChapterService {

    private final ChapterRepository chapterRepository;
    private final UserProgressRepository userProgressRepository;

    @Transactional(readOnly = true)
    public List<ChapterDto> getAllChaptersWithProgress(UUID userId) {
        return chapterRepository.findAll(Sort.by(Sort.Direction.ASC, "order")).stream().map(chapter -> {
            ChapterDto dto = new ChapterDto();
            dto.setId(chapter.getId());
            dto.setTitle(chapter.getTitle());
            dto.setDescription(chapter.getDescription());
            dto.setOrder(chapter.getOrder());
            dto.setGroupName(chapter.getGroupName());
            
            List<UserProgress> progress = userId != null ? userProgressRepository.findByUserIdAndChapterId(userId, chapter.getId()) : List.of();
            
            dto.setLessons(chapter.getLessons().stream()
                .sorted((l1, l2) -> l1.getOrder().compareTo(l2.getOrder()))
                .map(lesson -> {
                    LessonDto lDto = new LessonDto();
                    lDto.setId(lesson.getId());
                    lDto.setTitle(lesson.getTitle());
                    lDto.setOrder(lesson.getOrder());
                    lDto.setHasChallenge(lesson.isHasChallenge());
                    
                    progress.stream().filter(p -> p.getLesson().getId().equals(lesson.getId())).findFirst().ifPresent(p -> {
                        lDto.setCompleted(p.isCompleted());
                        lDto.setChallengePassed(p.isChallengePassed());
                    });
                    return lDto;
                }).collect(Collectors.toList()));
            
            return dto;
        }).collect(Collectors.toList());
    }
}
