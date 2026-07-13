package com.vpt.arena.entity;

import com.vpt.arena.entity.enums.Difficulty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "problems")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "difficulty_type", nullable = false)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private Difficulty difficulty;

    @Column(length = 100)
    private String topic;

    @Column(name = "time_limit_ms", nullable = false)
    private int timeLimitMs = 1000;

    @Column(name = "memory_limit_kb", nullable = false)
    private int memoryLimitKb = 256000;

    @Column(name = "test_cases", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String testCases;

    @Column(name = "solution_code", columnDefinition = "TEXT")
    private String solutionCode;

    @Column(name = "is_published", nullable = false)
    private boolean isPublished = false;

    @Column(name = "created_at", updatable = false)
    @CreatedDate
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @LastModifiedDate
    private OffsetDateTime updatedAt;
}
