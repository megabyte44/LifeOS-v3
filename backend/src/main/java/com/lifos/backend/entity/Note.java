package com.lifos.backend.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", nullable = false)
    private User user;

    @Column(nullable = false, length = 500)
    private String title;

    /**
     * Polymorphic content stored as JSONB.
     * - text/markdown:  JSON string   → "some text"
     * - checklist:      JSON array    → [{text, completed}, ...]
     * - snippet:        JSON object   → {code, language, input?, output?}
     *
     * JsonNode preserves the exact JSON structure sent by the client.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private JsonNode content;

    @Column(nullable = false, length = 20)
    private String type;       // 'text' | 'checklist' | 'markdown' | 'snippet'

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
