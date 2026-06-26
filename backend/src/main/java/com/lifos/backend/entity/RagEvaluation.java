package com.lifos.backend.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rag_evaluations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", referencedColumnName = "uid", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "retrieved_contexts", columnDefinition = "jsonb")
    private JsonNode retrievedContexts;

    private Float faithfulness;

    @Column(name = "answer_relevancy")
    private Float answerRelevancy;

    @Column(name = "context_precision")
    private Float contextPrecision;

    @Column(name = "model_used")
    private String modelUsed;

    private String personality;

    @Column(name = "context_token_count")
    private Integer contextTokenCount;

    @Column(name = "response_time_ms")
    private Long responseTimeMs;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
