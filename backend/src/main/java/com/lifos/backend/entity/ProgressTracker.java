package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "progress_trackers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressTracker {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private Goal goal;

    @Column(nullable = false, length = 30)
    private String type;           // 'percentage'|'fraction'|'dotChain'|'checkboxList'|'numberCounter'|'starRating'|'colorStatus'

    @Column(nullable = false, length = 255)
    private String label;

    @Column(name = "current_val")
    private Double current;

    @Column(name = "target_val")
    private Double target;

    @Column
    private Integer stars;

    @Column(name = "max_stars")
    private Integer maxStars;

    @Column(length = 20)
    private String status;         // ColorStatus: 'not-started'|'in-progress'|'almost-there'|'completed'

    @Column(name = "total_dots")
    private Integer totalDots;

    @Column(name = "filled_dots")
    private Integer filledDots;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer order = 0;
}
