package com.vpt.arena.repository;

import com.vpt.arena.entity.Room;
import com.vpt.arena.entity.enums.RoomStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {
    @EntityGraph(attributePaths = {"creator", "members", "members.user"})
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findDetailedById(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"creator", "members", "members.user"})
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findDetailedByIdForUpdate(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"creator", "members", "members.user"})
    List<Room> findByIsPublicTrueAndStatusOrderByCreatedAtDesc(RoomStatus status);
}
