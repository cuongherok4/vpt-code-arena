package com.vpt.arena.repository;

import com.vpt.arena.entity.DirectMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DirectMessageRepository extends JpaRepository<DirectMessage, UUID> {
    @Query("""
        SELECT m
        FROM DirectMessage m
        JOIN FETCH m.sender
        JOIN FETCH m.receiver
        WHERE (
            (m.sender.id = :currentUserId AND m.receiver.id = :otherUserId)
            OR (m.sender.id = :otherUserId AND m.receiver.id = :currentUserId)
        )
          AND (:before IS NULL OR m.createdAt < :before)
        ORDER BY m.createdAt DESC
        """)
    List<DirectMessage> findConversation(
        @Param("currentUserId") UUID currentUserId,
        @Param("otherUserId") UUID otherUserId,
        @Param("before") OffsetDateTime before,
        Pageable pageable
    );

    @Query("""
        SELECT m
        FROM DirectMessage m
        JOIN FETCH m.sender
        JOIN FETCH m.receiver
        WHERE m.sender.id = :userId OR m.receiver.id = :userId
        ORDER BY m.createdAt DESC
        """)
    List<DirectMessage> findRecentForUser(@Param("userId") UUID userId, Pageable pageable);
}
