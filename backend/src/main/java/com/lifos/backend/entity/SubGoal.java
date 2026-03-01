package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "sub_goals")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "children")
@ToString(exclude = "children")
public class SubGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private Goal goal;

    /** Self-referencing: null → top-level sub-goal */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private SubGoal parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SubGoal> children = new ArrayList<>();

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean completed = false;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(nullable = false)
    @Builder.Default
    private Integer level = 0;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer order = 0;
}
