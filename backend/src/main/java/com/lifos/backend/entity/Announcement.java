package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "announcements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String content = "";

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String type = "info";           // 'info'|'warning'|'success'|'update'

    @Column(length = 50)
    private String version;

    @Column(nullable = false)
    @Builder.Default
    private Boolean published = false;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "created_by", nullable = false, length = 128)
    @Builder.Default
    private String createdBy = "";
}
