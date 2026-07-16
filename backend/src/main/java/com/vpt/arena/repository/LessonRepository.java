package com.vpt.arena.repository;

import com.vpt.arena.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, UUID> {
    List<Lesson> findByChapterIdOrderByOrderAsc(UUID chapterId);

    /** JOIN FETCH chapter để tránh LazyInitializationException khi build UserProgress. */
    @Query("SELECT l FROM Lesson l JOIN FETCH l.chapter WHERE l.id = :id")
    Optional<Lesson> findByIdWithChapter(UUID id);
}

