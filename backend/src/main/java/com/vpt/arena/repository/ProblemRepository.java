package com.vpt.arena.repository;

import com.vpt.arena.entity.Problem;
import com.vpt.arena.entity.enums.Difficulty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, UUID> {
    @Query("""
        SELECT p
        FROM Problem p
        WHERE p.isPublished = true
          AND (:difficulty IS NULL OR p.difficulty = :difficulty)
          AND (:topic IS NULL OR LOWER(p.topic) = LOWER(:topic))
          AND (:keyword IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY p.difficulty ASC, p.title ASC
        """)
    List<Problem> findPublishedByFilters(
        @Param("difficulty") Difficulty difficulty,
        @Param("topic") String topic,
        @Param("keyword") String keyword
    );

    List<Problem> findByIsPublishedTrueOrderByDifficultyAscTitleAsc();
}
