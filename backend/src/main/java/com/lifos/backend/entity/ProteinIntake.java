package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "protein_intakes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProteinIntake {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_uid", nullable = false, length = 128)
    private String userUid;

    @Column(nullable = false)
    private Integer amount;

    @Column(nullable = false)
    @Builder.Default
    private Instant timestamp = Instant.now();
}
