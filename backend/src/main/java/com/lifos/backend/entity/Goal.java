package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "goals")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"progressTrackers", "subGoals", "notes", "resources"})
@ToString(exclude = {"progressTrackers", "subGoals", "notes", "resources"})
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", nullable = false)
    private User user;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(name = "goal_type", length = 30)
    private String goalType;       // 'step-by-step' | 'hierarchy' | 'milestone'

    @Column(nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String motive = "";

    @Column(nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String description = "";

    /**
     * JSONB array of habit UUIDs linked to this goal.
     * e.g. ["uuid1", "uuid2"]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "linked_habit_ids", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private List<String> linkedHabitIds = new ArrayList<>();

    @Column(name = "start_date", length = 10)
    private String startDate;       // 'yyyy-MM-dd'

    @Column(name = "target_date", length = 10)
    private String targetDate;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean archived = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // ── Child relationships (all cascade from Goal) ──

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sort_order ASC")
    @Builder.Default
    private List<ProgressTracker> progressTrackers = new ArrayList<>();

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("level ASC, sort_order ASC")
    @Builder.Default
    private List<SubGoal> subGoals = new ArrayList<>();

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sort_order ASC")
    @Builder.Default
    private List<GoalNote> notes = new ArrayList<>();

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sort_order ASC")
    @Builder.Default
    private List<GoalResource> resources = new ArrayList<>();
}
