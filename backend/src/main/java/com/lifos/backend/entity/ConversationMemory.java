package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversation_memories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationMemory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", referencedColumnName = "uid", nullable = false)
    private User user;

    @Column(name = "memory_text", nullable = false, columnDefinition = "TEXT")
    private String memoryText;

    @Column(name = "source_conversation_date")
    @Builder.Default
    private Instant sourceConversationDate = Instant.now();

    private String category;

    private Float confidence;

    @Column(name = "superseded_by")
    private UUID supersededBy;

    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
