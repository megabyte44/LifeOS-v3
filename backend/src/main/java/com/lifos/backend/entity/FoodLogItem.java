package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "food_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodLogItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_uid", nullable = false, length = 128)
    private String userUid;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private Instant timestamp = Instant.now();
}
