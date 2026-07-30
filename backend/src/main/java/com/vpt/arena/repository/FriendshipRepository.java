package com.vpt.arena.repository;

import com.vpt.arena.entity.Friendship;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {
    boolean existsByUserIdAndFriendId(UUID userId, UUID friendId);

    @EntityGraph(attributePaths = {"friend"})
    List<Friendship> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<Friendship> findByUserIdAndFriendId(UUID userId, UUID friendId);

    void deleteByUserIdAndFriendId(UUID userId, UUID friendId);
}
