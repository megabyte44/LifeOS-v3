package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "cycle_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CycleConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_uid", nullable = false, unique = true, length = 128)
    private String userUid;

    @Column(name = "start_date", nullable = false, length = 10)
    @Builder.Default
    private String startDate = "";

    @Column(name = "start_day_key", nullable = false, length = 100)
    @Builder.Default
    private String startDayKey = "";
}
