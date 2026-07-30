package com.vpt.arena.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "user_stats")
@Getter
@Setter
public class UserStats {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "total_points", nullable = false)
    private int totalPoints;

    private Integer rank;

    @Column(name = "total_ac", nullable = false)
    private int totalAc;

    @Column(name = "total_wa", nullable = false)
    private int totalWa;

    @Column(name = "ac_rate", nullable = false)
    private BigDecimal acRate = BigDecimal.ZERO;
}
