package com.vpt.arena.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "message_reports")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class MessageReport {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "message_kind", nullable = false, length = 20)
    private String messageKind;

    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by", nullable = false)
    private User reportedBy;

    @Column(length = 500)
    private String reason;

    @Column(name = "created_at", updatable = false)
    @CreatedDate
    private OffsetDateTime createdAt;
}
