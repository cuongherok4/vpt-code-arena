package com.vpt.arena.repository;

import com.vpt.arena.entity.ChatMute;
import com.vpt.arena.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatMuteRepository extends JpaRepository<ChatMute, UUID> {
    Optional<ChatMute> findByOwnerAndMutedUser(User owner, User mutedUser);

    void deleteByOwnerAndMutedUser(User owner, User mutedUser);

    @Query("""
        SELECT m.mutedUser.id
        FROM ChatMute m
        WHERE m.owner.id = :ownerId
          AND (m.expiresAt IS NULL OR m.expiresAt > :now)
        """)
    List<UUID> findActiveMutedUserIds(@Param("ownerId") UUID ownerId, @Param("now") OffsetDateTime now);
}
