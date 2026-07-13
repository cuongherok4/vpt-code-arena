package com.vpt.arena.entity;

import com.vpt.arena.entity.enums.Difficulty;
import com.vpt.arena.entity.enums.RoomStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "rooms")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User creator;

    @Column(nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "room_status", nullable = false)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private RoomStatus status = RoomStatus.WAITING;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic = false;

    @Column(name = "max_members", nullable = false)
    private int maxMembers = 20;

    @Column(name = "num_problems", nullable = false)
    private int numProblems;

    @Column(name = "time_limit_min", nullable = false)
    private int timeLimitMin;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "difficulty_type")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private Difficulty difficulty;

    @Column(length = 100)
    private String topic;

    @Column(name = "start_time")
    private OffsetDateTime startTime;

    @Column(name = "end_time")
    private OffsetDateTime endTime;

    @Column(name = "created_at", updatable = false)
    @CreatedDate
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoomMember> members = new ArrayList<>();
}
