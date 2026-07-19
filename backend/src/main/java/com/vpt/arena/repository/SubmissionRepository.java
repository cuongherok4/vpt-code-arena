package com.vpt.arena.repository;

import com.vpt.arena.entity.Submission;
import com.vpt.arena.entity.enums.JudgeResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, UUID> {
    @Query("SELECT s FROM Submission s JOIN FETCH s.problem WHERE s.id = :id")
    Optional<Submission> findByIdWithProblem(@Param("id") UUID id);

    List<Submission> findTop20ByUserIdAndProblemIdOrderBySubmittedAtDesc(UUID userId, UUID problemId);

    @Query("""
        SELECT s
        FROM Submission s
        JOIN FETCH s.problem
        WHERE s.user.id = :userId
        ORDER BY s.submittedAt DESC
        """)
    List<Submission> findRecentByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("""
        SELECT
            s.user.id AS userId,
            s.user.name AS userName,
            s.points AS points,
            s.executionTime AS executionTime,
            s.memoryUsed AS memoryUsed,
            s.submittedAt AS submittedAt,
            (
                SELECT COUNT(accepted.id)
                FROM Submission accepted
                WHERE accepted.problem.id = :problemId
                  AND accepted.result = :result
                  AND accepted.user.id = s.user.id
            ) AS acceptedCount
        FROM Submission s
        WHERE s.problem.id = :problemId
          AND s.language = :language
          AND s.result = :result
          AND NOT EXISTS (
              SELECT better.id
              FROM Submission better
              WHERE better.problem.id = :problemId
                AND better.language = :language
                AND better.result = :result
                AND better.user.id = s.user.id
                AND (
                    better.points > s.points
                    OR (
                        better.points = s.points
                        AND COALESCE(better.executionTime, 2147483647) < COALESCE(s.executionTime, 2147483647)
                    )
                    OR (
                        better.points = s.points
                        AND COALESCE(better.executionTime, 2147483647) = COALESCE(s.executionTime, 2147483647)
                        AND better.submittedAt < s.submittedAt
                    )
                )
          )
        ORDER BY s.points DESC, COALESCE(s.executionTime, 2147483647) ASC, s.submittedAt ASC
        """)
    List<ExamLeaderboardRow> findLeaderboardRows(
        @Param("problemId") UUID problemId,
        @Param("language") String language,
        @Param("result") JudgeResult result,
        Pageable pageable
    );

    @Query("""
        SELECT
            s.user.id AS userId,
            s.user.publicId AS publicId,
            s.user.name AS userName,
            SUM(s.points) AS totalPoints,
            COUNT(s.problem.id) AS totalAccepted,
            MAX(s.submittedAt) AS lastAcceptedAt
        FROM Submission s
        WHERE s.result = :result
          AND (:language IS NULL OR s.language = :language)
          AND NOT EXISTS (
              SELECT better.id
              FROM Submission better
              WHERE better.user.id = s.user.id
                AND better.problem.id = s.problem.id
                AND better.result = :result
                AND (:language IS NULL OR better.language = :language)
                AND (
                    better.points > s.points
                    OR (
                        better.points = s.points
                        AND better.submittedAt < s.submittedAt
                    )
                )
          )
        GROUP BY s.user.id, s.user.publicId, s.user.name
        ORDER BY SUM(s.points) DESC, COUNT(s.problem.id) DESC, MAX(s.submittedAt) ASC
        """)
    List<GlobalLeaderboardRow> findGlobalExamLeaderboardRows(
        @Param("result") JudgeResult result,
        @Param("language") String language,
        Pageable pageable
    );

    interface ExamLeaderboardRow {
        UUID getUserId();
        String getUserName();
        Integer getPoints();
        Integer getExecutionTime();
        Integer getMemoryUsed();
        OffsetDateTime getSubmittedAt();
        Long getAcceptedCount();
    }

    interface GlobalLeaderboardRow {
        UUID getUserId();
        String getPublicId();
        String getUserName();
        Number getTotalPoints();
        Long getTotalAccepted();
        OffsetDateTime getLastAcceptedAt();
    }
}
