package com.lifos.backend.repository;

import com.lifos.backend.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HabitRepository extends JpaRepository<Habit, UUID> {
    List<Habit> findAllByUserUid(String userUid);
    List<Habit> findAllByUserUidAndContext(String userUid, String context);
    Optional<Habit> findByIdAndUserUid(UUID id, String userUid);
    long countByUserUid(String userUid);
}
