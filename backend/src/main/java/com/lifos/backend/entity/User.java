package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * JPA Entity: maps to the "users" table.
 *
 * KEY CONCEPTS:
 * - @Entity  → tells JPA "this class = a database table"
 * - @Table   → specifies the exact table name
 * - @Id      → marks the primary key
 * - @Column  → maps a field to a column (optional if names match)
 * - Lombok @Data → auto-generates getters, setters, toString, equals, hashCode
 * - Lombok @Builder → lets you create objects like: User.builder().email("x").build()
 */
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @Column(name = "uid", nullable = false, length = 128)
    private String uid;                   // Firebase UID — NOT auto-generated

    @Column(nullable = false)
    private String email;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "photo_url")
    private String photoURL;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "user";         // "user" or "admin"

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
