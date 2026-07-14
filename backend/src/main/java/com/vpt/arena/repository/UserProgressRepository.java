package com.vpt.arena.repository;

import com.vpt.arena.entity.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserProgressRepository extends JpaRepository<UserProgress, UUID> {
    Optional<UserProgress> findByUserIdAndLessonId(UUID userId, UUID lessonId);
    List<UserProgress> findByUserIdAndChapterId(UUID userId, UUID chapterId);
    List<UserProgress> findByUserId(UUID userId);
}

