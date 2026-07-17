package com.vpt.arena.repository;

import com.vpt.arena.entity.BattleSubmission;
import com.vpt.arena.entity.enums.JudgeResult;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BattleSubmissionRepository extends JpaRepository<BattleSubmission, UUID> {
    @EntityGraph(attributePaths = {"room", "problem", "user"})
    @Query("SELECT s FROM BattleSubmission s WHERE s.id = :id")
    Optional<BattleSubmission> findWithRoomAndProblemAndUserById(@Param("id") UUID id);

    @Query("""
        SELECT COALESCE(MAX(s.points), 0)
        FROM BattleSubmission s
        WHERE s.room.id = :roomId
          AND s.user.id = :userId
          AND s.problem.id = :problemId
          AND s.result = :result
        """)
    int maxPointsByRoomUserProblemAndResult(
        @Param("roomId") UUID roomId,
        @Param("userId") UUID userId,
        @Param("problemId") UUID problemId,
        @Param("result") JudgeResult result
    );

    List<BattleSubmission> findByRoomIdOrderBySubmittedAtAsc(UUID roomId);

    @Query("""
        SELECT s
        FROM BattleSubmission s
        JOIN FETCH s.problem
        JOIN FETCH s.room
        WHERE s.user.id = :userId
        ORDER BY s.submittedAt DESC
        """)
    List<BattleSubmission> findRecentByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("""
        SELECT s
        FROM BattleSubmission s
        JOIN FETCH s.user
        JOIN FETCH s.problem
        WHERE s.room.id = :roomId
        ORDER BY s.submittedAt ASC
        """)
    List<BattleSubmission> findLeaderboardSubmissions(@Param("roomId") UUID roomId);
}
