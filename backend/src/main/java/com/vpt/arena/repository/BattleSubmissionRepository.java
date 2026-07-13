package com.vpt.arena.repository;

import com.vpt.arena.entity.BattleSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BattleSubmissionRepository extends JpaRepository<BattleSubmission, UUID> {
}
