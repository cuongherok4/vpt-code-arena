package com.vpt.arena.repository;

import com.vpt.arena.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    @Query("""
        SELECT m
        FROM ChatMessage m
        JOIN FETCH m.user
        LEFT JOIN FETCH m.room
        WHERE m.room IS NULL
          AND (:before IS NULL OR m.createdAt < :before)
        ORDER BY m.createdAt DESC
        """)
    List<ChatMessage> findGlobalMessages(@Param("before") OffsetDateTime before, Pageable pageable);

    @Query("""
        SELECT m
        FROM ChatMessage m
        JOIN FETCH m.user
        JOIN FETCH m.room
        WHERE m.room.id = :roomId
          AND (:before IS NULL OR m.createdAt < :before)
        ORDER BY m.createdAt DESC
        """)
    List<ChatMessage> findRoomMessages(
        @Param("roomId") UUID roomId,
        @Param("before") OffsetDateTime before,
        Pageable pageable
    );
}
