package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "memory_relationships")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemoryRelationship {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", referencedColumnName = "uid", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_memory_id", nullable = false)
    private ConversationMemory fromMemory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_memory_id", nullable = false)
    private ConversationMemory toMemory;

    @Column(name = "relationship_type", nullable = false, length = 30)
    private String relationshipType;

    @Builder.Default
    private Float confidence = 0.7f;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
