package com.vpt.arena.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "room_results", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"room_id", "user_id"})
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class RoomResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "total_points", nullable = false)
    private int totalPoints;

    @Column(nullable = false)
    private int rank;

    @Column(name = "last_ac_time")
    private OffsetDateTime lastAcTime;

    @Column(name = "created_at", updatable = false)
    @CreatedDate
    private OffsetDateTime createdAt;
}
