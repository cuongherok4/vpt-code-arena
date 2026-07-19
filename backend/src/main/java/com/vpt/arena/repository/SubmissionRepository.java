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

    @Query(value = """
        SELECT
            u.id AS userId,
            u.public_id AS publicId,
            u.name AS userName,
            COALESCE(SUM(best.points), 0) AS totalPoints,
            COUNT(best.item_key) AS totalAccepted,
            MAX(best.last_accepted_at) AS lastAcceptedAt
        FROM users u
        JOIN (
            SELECT
                s.user_id,
                'exam:' || s.problem_id::text AS item_key,
                MAX(s.points) AS points,
                MIN(s.submitted_at) AS last_accepted_at
            FROM submissions s
            WHERE CAST(:type AS text) IN ('all', 'exam')
              AND s.result = 'AC'
              AND (:language IS NULL OR s.language = :language)
            GROUP BY s.user_id, s.problem_id
            UNION ALL
            SELECT
                bs.user_id,
                'battle:' || bs.room_id::text || ':' || bs.problem_id::text AS item_key,
                MAX(bs.points) AS points,
                MIN(bs.submitted_at) AS last_accepted_at
            FROM battle_submissions bs
            WHERE CAST(:type AS text) IN ('all', 'battle')
              AND bs.result = 'AC'
              AND (:language IS NULL OR bs.language = :language)
            GROUP BY bs.user_id, bs.room_id, bs.problem_id
        ) best ON best.user_id = u.id
        GROUP BY u.id, u.public_id, u.name
        ORDER BY totalPoints DESC, totalAccepted DESC, lastAcceptedAt ASC
        """, nativeQuery = true)
    List<GlobalLeaderboardRow> findGlobalLeaderboardRows(
        @Param("type") String type,
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
        Integer getTotalPoints();
        Long getTotalAccepted();
        OffsetDateTime getLastAcceptedAt();
    }
}
