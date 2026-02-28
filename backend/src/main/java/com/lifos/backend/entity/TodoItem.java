package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity: maps to the "todos" table.
 *
 * KEY CONCEPTS:
 * - @GeneratedValue(strategy = GenerationType.AUTO) → auto-generate UUID
 * - @ManyToOne → each TodoItem belongs to one User
 * - @JoinColumn → specifies the foreign key column in the DB
 */
@Entity
@Table(name = "todos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Many todos belong to one user.
     * FetchType.LAZY = don't load the full User object until we access it.
     * This is more performant (avoids unnecessary JOIN queries).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", nullable = false)
    private User user;

    @Column(nullable = false, length = 500)
    private String text;

    @Column(nullable = false)
    @Builder.Default
    private Boolean completed = false;

    @Column(length = 10)
    private String priority;           // "high", "medium", "low", or null

    @Column(nullable = false)
    @Builder.Default
    private Boolean postponed = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
