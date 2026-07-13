package com.vpt.arena.repository;

import com.vpt.arena.entity.UserLearnProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserLearnProgressRepository extends JpaRepository<UserLearnProgress, UUID> {
}
