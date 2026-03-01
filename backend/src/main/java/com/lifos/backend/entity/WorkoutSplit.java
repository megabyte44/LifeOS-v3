package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "workout_splits")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutSplit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_uid", nullable = false, unique = true, length = 128)
    private String userUid;

    /**
     * Stores the entire CyclicalWorkoutSplit JSON blob.
     * Structure: Record<string, WorkoutDay> where WorkoutDay = { title: string; exercises: Exercise[] }
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> split = Map.of();
}
