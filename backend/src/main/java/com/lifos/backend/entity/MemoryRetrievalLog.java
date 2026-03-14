package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "memory_retrieval_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemoryRetrievalLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", referencedColumnName = "uid", nullable = false)
    private User user;

    @Column(name = "query_text", nullable = false, columnDefinition = "TEXT")
    private String queryText;

    @Column(name = "memory_id")
    private UUID memoryId;

    @Column(name = "embedding_id")
    private UUID embeddingId;

    @Column(name = "source_type", nullable = false, length = 100)
    private String sourceType;

    @Column(name = "ranking_score", nullable = false)
    private Float rankingScore;

    @Column(name = "vector_score", nullable = false)
    @Builder.Default
    private Float vectorScore = 0f;

    @Column(name = "structured_score", nullable = false)
    @Builder.Default
    private Float structuredScore = 0f;

    @Column(name = "recency_score", nullable = false)
    @Builder.Default
    private Float recencyScore = 0f;

    @Column(name = "importance_score", nullable = false)
    @Builder.Default
    private Float importanceScore = 0f;

    @Column(name = "confidence_score", nullable = false)
    @Builder.Default
    private Float confidenceScore = 0f;

    @Column(name = "selected", nullable = false)
    @Builder.Default
    private Boolean selected = false;

    @Column(name = "token_estimate", nullable = false)
    @Builder.Default
    private Integer tokenEstimate = 0;

    @Column(name = "graph_score", nullable = false)
    @Builder.Default
    private Float graphScore = 0f;

    @Column(name = "query_intent", length = 100)
    private String queryIntent;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
