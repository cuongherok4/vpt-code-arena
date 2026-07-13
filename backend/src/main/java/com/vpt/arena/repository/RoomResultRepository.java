package com.vpt.arena.repository;

import com.vpt.arena.entity.RoomResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RoomResultRepository extends JpaRepository<RoomResult, UUID> {
}
