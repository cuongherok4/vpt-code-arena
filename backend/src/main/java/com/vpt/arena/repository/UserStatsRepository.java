package com.vpt.arena.repository;

import com.vpt.arena.entity.UserStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserStatsRepository extends JpaRepository<UserStats, UUID> {

    @Modifying
    @Query(value = """
        INSERT INTO user_stats (user_id, total_points, total_ac, total_wa, ac_rate)
        SELECT
            CAST(:userId AS uuid),
            CAST(COALESCE((
                SELECT SUM(best.points)
                FROM (
                    SELECT MAX(points) AS points
                    FROM submissions
                    WHERE user_id = CAST(:userId AS uuid)
                      AND result = 'AC'
                    GROUP BY problem_id
                    UNION ALL
                    SELECT MAX(points) AS points
                    FROM battle_submissions
                    WHERE user_id = CAST(:userId AS uuid)
                      AND result = 'AC'
                    GROUP BY room_id, problem_id
                ) best
            ), 0) AS INT),
            CAST((
                SELECT COUNT(*)
                FROM (
                    SELECT problem_id
                    FROM submissions
                    WHERE user_id = CAST(:userId AS uuid)
                      AND result = 'AC'
                    GROUP BY problem_id
                    UNION ALL
                    SELECT problem_id
                    FROM battle_submissions
                    WHERE user_id = CAST(:userId AS uuid)
                      AND result = 'AC'
                    GROUP BY room_id, problem_id
                ) accepted
            ) AS INT),
            CAST((
                SELECT
                    (SELECT COUNT(*) FROM submissions WHERE user_id = CAST(:userId AS uuid) AND result = 'WA')
                    + (SELECT COUNT(*) FROM battle_submissions WHERE user_id = CAST(:userId AS uuid) AND result = 'WA')
            ) AS INT),
            COALESCE((
                SELECT ROUND(
                    COUNT(*) FILTER (WHERE result = 'AC') * 100.0
                    / NULLIF(COUNT(*) FILTER (WHERE result <> 'PENDING'), 0),
                    2
                )
                FROM (
                    SELECT result FROM submissions WHERE user_id = CAST(:userId AS uuid)
                    UNION ALL
                    SELECT result FROM battle_submissions WHERE user_id = CAST(:userId AS uuid)
                ) all_submissions
            ), 0)
        ON CONFLICT (user_id) DO UPDATE SET
            total_points = EXCLUDED.total_points,
            total_ac = EXCLUDED.total_ac,
            total_wa = EXCLUDED.total_wa,
            ac_rate = EXCLUDED.ac_rate
        """, nativeQuery = true)
    void refreshForUser(@Param("userId") UUID userId);
}
