package com.vpt.arena.repository;

import com.vpt.arena.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, UUID> {
    @Query("SELECT s FROM Submission s JOIN FETCH s.problem WHERE s.id = :id")
    Optional<Submission> findByIdWithProblem(@Param("id") UUID id);

    List<Submission> findTop20ByUserIdAndProblemIdOrderBySubmittedAtDesc(UUID userId, UUID problemId);
}
