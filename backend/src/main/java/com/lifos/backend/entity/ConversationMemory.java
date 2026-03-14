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

    private String domain;

    private Float confidence;

    @Column(name = "factuality_score")
    @Builder.Default
    private Float factualityScore = 0.7f;

    @Column(name = "relevance_score")
    @Builder.Default
    private Float relevanceScore = 0.7f;

    @Column(name = "timeliness_score")
    @Builder.Default
    private Float timelinessScore = 0.7f;

    @Column(name = "overall_confidence")
    @Builder.Default
    private Float overallConfidence = 0.7f;

    @Column(name = "memory_hash", nullable = false, length = 64)
    private String memoryHash;

    @Column(name = "last_verified_at")
    private Instant lastVerifiedAt;

    @Column(name = "verification_status", length = 30)
    @Builder.Default
    private String verificationStatus = "unverified";

    @Column(name = "extraction_model", length = 120)
    private String extractionModel;

    @Column(name = "extraction_confidence")
    private Float extractionConfidence;

    @Column(name = "superseded_by")
    private UUID supersededBy;

    @Column(name = "parent_memory_id")
    private UUID parentMemoryId;

    @Column(name = "archived_at")
    private Instant archivedAt;

    @Column(name = "access_count")
    @Builder.Default
    private Integer accessCount = 0;

    @Column(name = "last_accessed_at")
    private Instant lastAccessedAt;

    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
