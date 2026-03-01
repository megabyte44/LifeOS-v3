package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "gym_completions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GymCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_uid", nullable = false, unique = true, length = 128)
    private String userUid;

    /** Record<string, boolean>: date string → completed flag */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> completions = Map.of();
}
