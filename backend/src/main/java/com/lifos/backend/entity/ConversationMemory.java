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

    // ── Memory Graph fields (Phase 2) ──────────────────────────────────────────
    /**
     * Whether this memory represents a long-term fact ('static') or
     * recent/evolving context ('dynamic'). Classified by LLM at extraction time.
     */
    @Column(name = "memory_type", length = 20)
    @Builder.Default
    private String memoryType = "dynamic";

    /**
     * True when this is the current head of its version chain.
     * Set to false when superseded by a newer 'updates' edge.
     */
    @Column(name = "is_latest")
    @Builder.Default
    private Boolean isLatest = true;

    /**
     * Forward pointer to the next version of this memory (doubly-linked version chain).
     * Null when this is the newest version.
     */
    @Column(name = "next_version_id")
    private UUID nextVersionId;

    /**
     * Timestamp after which this memory should be treated as forgotten.
     * Only set for temporal facts ("meeting tomorrow", "exam next week").
     */
    @Column(name = "expires_at")
    private Instant expiresAt;

    /**
     * The AiConversation session that produced this memory (provenance tracking).
     * Null for memories extracted before V30 or for manually created memories.
     */
    @Column(name = "session_id")
    private UUID sessionId;

    /**
     * True when this memory has been auto-forgotten (expired) by the lifecycle job.
     * Forgotten memories are excluded from context assembly and profile generation.
     */
    @Column(name = "forgotten")
    @Builder.Default
    private Boolean forgotten = false;

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
