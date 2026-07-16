package com.vpt.arena.repository;

import com.vpt.arena.entity.RoomResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomResultRepository extends JpaRepository<RoomResult, UUID> {
    Optional<RoomResult> findByRoomIdAndUserId(UUID roomId, UUID userId);

    List<RoomResult> findByRoomIdOrderByRankAsc(UUID roomId);

    void deleteByRoomId(UUID roomId);
}
