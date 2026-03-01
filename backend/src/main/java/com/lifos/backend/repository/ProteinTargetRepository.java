package com.lifos.backend.repository;

import com.lifos.backend.entity.ProteinTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProteinTargetRepository extends JpaRepository<ProteinTarget, UUID> {
    Optional<ProteinTarget> findByUserUid(String userUid);
}
