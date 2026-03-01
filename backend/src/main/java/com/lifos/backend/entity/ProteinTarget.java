package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "protein_targets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProteinTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_uid", nullable = false, unique = true, length = 128)
    private String userUid;

    @Column(nullable = false)
    @Builder.Default
    private Integer target = 150;
}
