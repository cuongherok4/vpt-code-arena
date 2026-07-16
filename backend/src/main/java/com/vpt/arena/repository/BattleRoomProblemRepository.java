package com.vpt.arena.repository;

import com.vpt.arena.entity.BattleRoomProblem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BattleRoomProblemRepository extends JpaRepository<BattleRoomProblem, UUID> {
    @EntityGraph(attributePaths = {"problem"})
    List<BattleRoomProblem> findByRoomIdOrderByOrderAsc(UUID roomId);

    boolean existsByRoomId(UUID roomId);
}
