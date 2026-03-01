package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "budgets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_uid", nullable = false, unique = true)
    private String userUid;

    @Column(nullable = false)
    @Builder.Default
    private Long budget = 0L;     // monthly budget in cents
}
