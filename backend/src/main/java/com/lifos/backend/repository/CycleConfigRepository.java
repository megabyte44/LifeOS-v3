package com.lifos.backend.repository;

import com.lifos.backend.entity.CycleConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CycleConfigRepository extends JpaRepository<CycleConfig, UUID> {
    Optional<CycleConfig> findByUserUid(String userUid);
}
