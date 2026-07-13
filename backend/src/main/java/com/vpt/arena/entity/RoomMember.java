package com.vpt.arena.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "room_members", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"room_id", "user_id"})
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class RoomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "is_ready", nullable = false)
    private boolean isReady = false;

    @Column(name = "joined_at", nullable = false, updatable = false)
    @CreatedDate
    private OffsetDateTime joinedAt;
}
