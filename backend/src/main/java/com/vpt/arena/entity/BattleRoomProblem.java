package com.vpt.arena.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "battle_room_problems", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"room_id", "\"order\""})
})
@Getter
@Setter
public class BattleRoomProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(name = "\"order\"", nullable = false)
    private int order;
}
