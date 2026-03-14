package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "knowledge_edges")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeEdge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", referencedColumnName = "uid", nullable = false)
    private User user;

    @Column(name = "from_type", nullable = false, length = 50)
    private String fromType;

    @Column(name = "from_id", nullable = false)
    private UUID fromId;

    @Column(name = "to_type", nullable = false, length = 50)
    private String toType;

    @Column(name = "to_id", nullable = false)
    private UUID toId;

    @Column(nullable = false, length = 50)
    private String relationship;

    @Builder.Default
    private Float confidence = 0.7f;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "extraction_model", length = 120)
    private String extractionModel;

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
