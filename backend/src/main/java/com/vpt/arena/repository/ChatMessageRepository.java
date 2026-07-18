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
    default List<ChatMessage> findGlobalMessages(OffsetDateTime before, Pageable pageable) {
        return before == null ? findRecentGlobalMessages(pageable) : findGlobalMessagesBefore(before, pageable);
    }

    @Query("""
        SELECT m
        FROM ChatMessage m
        JOIN FETCH m.user
        LEFT JOIN FETCH m.room
        WHERE m.room IS NULL
        ORDER BY m.createdAt DESC
        """)
    List<ChatMessage> findRecentGlobalMessages(Pageable pageable);

    @Query("""
        SELECT m
        FROM ChatMessage m
        JOIN FETCH m.user
        LEFT JOIN FETCH m.room
        WHERE m.room IS NULL
          AND m.createdAt < :before
        ORDER BY m.createdAt DESC
        """)
    List<ChatMessage> findGlobalMessagesBefore(@Param("before") OffsetDateTime before, Pageable pageable);

    default List<ChatMessage> findRoomMessages(UUID roomId, OffsetDateTime before, Pageable pageable) {
        return before == null ? findRecentRoomMessages(roomId, pageable) : findRoomMessagesBefore(roomId, before, pageable);
    }

    @Query("""
        SELECT m
        FROM ChatMessage m
        JOIN FETCH m.user
        JOIN FETCH m.room
        WHERE m.room.id = :roomId
        ORDER BY m.createdAt DESC
        """)
    List<ChatMessage> findRecentRoomMessages(@Param("roomId") UUID roomId, Pageable pageable);

    @Query("""
        SELECT m
        FROM ChatMessage m
        JOIN FETCH m.user
        JOIN FETCH m.room
        WHERE m.room.id = :roomId
          AND m.createdAt < :before
        ORDER BY m.createdAt DESC
        """)
    List<ChatMessage> findRoomMessagesBefore(
        @Param("roomId") UUID roomId,
        @Param("before") OffsetDateTime before,
        Pageable pageable
    );
}
