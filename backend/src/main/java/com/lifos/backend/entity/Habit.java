package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "habits")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Habit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 100)
    private String icon;

    @Column
    private Integer target;

    /**
     * JSONB map of date → boolean|number completions.
     * e.g. {"2024-07-21": true, "2024-07-22": 4}
     * Jackson serializes Map<String, Object> naturally.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private Map<String, Object> completions = new HashMap<>();

    @Column(name = "habit_type", length = 20)
    private String habitType;        // 'repetitive' | 'sprint'

    @Column(name = "sprint_duration")
    private Integer sprintDuration;

    @Column(name = "sprint_end_date", length = 10)
    private String sprintEndDate;    // 'yyyy-MM-dd'

    @Column(name = "sprint_start_date", length = 10)
    private String sprintStartDate;  // 'yyyy-MM-dd'

    @Column(length = 50)
    private String context;          // 'gym' or null — used for filtering

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
