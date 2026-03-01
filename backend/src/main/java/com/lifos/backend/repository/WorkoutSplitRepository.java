package com.lifos.backend.repository;

import com.lifos.backend.entity.WorkoutSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkoutSplitRepository extends JpaRepository<WorkoutSplit, UUID> {
    Optional<WorkoutSplit> findByUserUid(String userUid);
}
