package com.lifos.backend.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_chat_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", referencedColumnName = "uid", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String mode = "normal";

    @Column(length = 50)
    private String personality;

    @Column(length = 50)
    private String provider;

    @Column(length = 255)
    private String model;

    @Column(name = "user_message", nullable = false, columnDefinition = "TEXT")
    private String userMessage;

    @Column(name = "assistant_message", nullable = false, columnDefinition = "TEXT")
    private String assistantMessage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "request_messages", columnDefinition = "jsonb")
    private JsonNode requestMessages;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response_metadata", columnDefinition = "jsonb")
    private JsonNode responseMetadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
