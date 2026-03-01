package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "ai_configurations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "system_instructions", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> systemInstructions = Map.of();

    @Column(name = "default_personality", nullable = false, length = 20)
    @Builder.Default
    private String defaultPersonality = "casual";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "model_config", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> modelConfig = Map.of();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "api_keys", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> apiKeys = Map.of();

    @Column(name = "rag_enabled", nullable = false)
    @Builder.Default
    private Boolean ragEnabled = false;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "updated_by", nullable = false, length = 128)
    @Builder.Default
    private String updatedBy = "";
}
