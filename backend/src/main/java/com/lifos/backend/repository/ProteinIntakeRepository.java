package com.lifos.backend.repository;

import com.lifos.backend.entity.ProteinIntake;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProteinIntakeRepository extends JpaRepository<ProteinIntake, UUID> {
    List<ProteinIntake> findAllByUserUid(String userUid);
    Optional<ProteinIntake> findByIdAndUserUid(UUID id, String userUid);
}
