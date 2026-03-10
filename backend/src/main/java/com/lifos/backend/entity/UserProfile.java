package com.lifos.backend.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", referencedColumnName = "uid", nullable = false)
    private User user;

    private Integer age;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(columnDefinition = "TEXT")
    private String philosophy;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode interests;

    @Column(name = "sleep_target_hours")
    private Double sleepTargetHours;

    @Column(name = "daily_calorie_target")
    private Integer dailyCalorieTarget;

    @Column(name = "protein_target_override")
    private Integer proteinTargetOverride;

    private String occupation;

    private String timezone;

    @Column(name = "life_motto", columnDefinition = "TEXT")
    private String lifeMotto;

    // ── Dynamic enrichment fields (V24) ─────────────────────────────

    @Column(name = "profile_completeness")
    @Builder.Default
    private Integer profileCompleteness = 0;

    @Column(name = "last_enriched_at")
    private Instant lastEnrichedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "enrichment_sources", columnDefinition = "jsonb")
    private JsonNode enrichmentSources;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "pending_questions", columnDefinition = "jsonb")
    private JsonNode pendingQuestions;

    @Column(name = "life_summary", columnDefinition = "TEXT")
    private String lifeSummary;

    // ── Timestamps ──────────────────────────────────────────────────

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
