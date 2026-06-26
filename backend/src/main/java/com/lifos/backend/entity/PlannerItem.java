package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "planner_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlannerItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", nullable = false)
    private User user;

    /** Day key, e.g. 'Monday', 'Tuesday', or a date string 'yyyy-MM-dd'. */
    @Column(nullable = false, length = 100)
    private String day;

    @Column(name = "start_time", nullable = false, length = 5)
    private String startTime;

    @Column(name = "end_time", nullable = false, length = 5)
    private String endTime;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 100)
    private String tag;
}
