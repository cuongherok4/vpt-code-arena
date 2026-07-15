package com.vpt.arena.entity;

import com.vpt.arena.entity.enums.JudgeResult;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "submissions")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String code;

    @Column(nullable = false, length = 20)
    private String language;

    @Column(nullable = false)
    private int points = 0;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "judge_result", nullable = false)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private JudgeResult result = JudgeResult.PENDING;

    @Column(name = "execution_time")
    private Integer executionTime;

    @Column(name = "memory_used")
    private Integer memoryUsed;

    @Column(name = "error_output", columnDefinition = "TEXT")
    private String errorOutput;

    @Column(name = "submitted_at", updatable = false)
    @CreatedDate
    private OffsetDateTime submittedAt;
}
