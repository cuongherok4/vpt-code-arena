package com.vpt.arena.repository;

import com.vpt.arena.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, UUID>, JpaSpecificationExecutor<Problem> {
    List<Problem> findByIsPublishedTrueOrderByDifficultyAscTitleAsc();

    long countByIsPublishedTrue();
}
