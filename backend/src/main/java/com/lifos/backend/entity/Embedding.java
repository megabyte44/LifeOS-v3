package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "embeddings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Embedding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", referencedColumnName = "uid", nullable = false)
    private User user;

    @Column(name = "source_type", nullable = false)
    private String sourceType;

    @Column(name = "source_id", nullable = false)
    private UUID sourceId;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @Column(name = "content_preview", columnDefinition = "TEXT")
    private String contentPreview;

    private String domain;

    @Column(name = "domain_tag", length = 50)
    private String domainTag;

    @Column(name = "embedding_quality_score")
    @Builder.Default
    private Float embeddingQualityScore = 0.7f;

    @Column(name = "recency_weight")
    @Builder.Default
    private Float recencyWeight = 0.5f;

    @Column(name = "importance_signal")
    @Builder.Default
    private Float importanceSignal = 0.5f;

    @Column(name = "last_used_in_context")
    private Instant lastUsedInContext;

    // ── Document-chunking metadata ──────────────────────────────────────────
    /** Position of this chunk within the parent document (0-based). */
    @Column(name = "chunk_index")
    @Builder.Default
    private Integer chunkIndex = 0;

    /** Total number of chunks for this source document. */
    @Column(name = "total_chunks")
    @Builder.Default
    private Integer totalChunks = 1;

    /**
     * For chunk rows: the source_id of the original (parent) document.
     * NULL for non-chunked embeddings.
     */
    @Column(name = "parent_source_id")
    private UUID parentSourceId;

    /** Character offset where this chunk starts in the original document text. */
    @Column(name = "chunk_start_char")
    private Integer chunkStartChar;

    /** Character offset where this chunk ends in the original document text. */
    @Column(name = "chunk_end_char")
    private Integer chunkEndChar;

    @Column(name = "embedding")
    @JdbcTypeCode(SqlTypes.VECTOR)
    private float[] embedding;

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
