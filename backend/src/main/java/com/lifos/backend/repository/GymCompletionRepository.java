package com.lifos.backend.repository;

import com.lifos.backend.entity.GymCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GymCompletionRepository extends JpaRepository<GymCompletion, UUID> {
    Optional<GymCompletion> findByUserUid(String userUid);
}
