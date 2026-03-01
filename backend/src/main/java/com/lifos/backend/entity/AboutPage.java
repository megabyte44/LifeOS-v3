package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "about_page")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AboutPage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 500)
    @Builder.Default
    private String title = "LifeOS";

    @Column(nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String description = "";

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String version = "1.0.0";

    @Column(name = "markdown_content", columnDefinition = "TEXT")
    private String markdownContent;

    /** Array of { icon, title, description } objects */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private List<Object> features = List.of();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> contact = Map.of();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "updated_by", nullable = false, length = 128)
    @Builder.Default
    private String updatedBy = "";
}
