package com.lifos.backend.repository;

import com.lifos.backend.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GoalRepository extends JpaRepository<Goal, UUID> {

    @Query("SELECT g FROM Goal g LEFT JOIN FETCH g.progressTrackers LEFT JOIN FETCH g.subGoals " +
           "LEFT JOIN FETCH g.notes LEFT JOIN FETCH g.resources " +
           "WHERE g.user.uid = :userUid ORDER BY g.createdAt DESC")
    List<Goal> findAllByUserUidWithChildren(String userUid);

    @Query("SELECT g FROM Goal g LEFT JOIN FETCH g.progressTrackers LEFT JOIN FETCH g.subGoals " +
           "LEFT JOIN FETCH g.notes LEFT JOIN FETCH g.resources " +
           "WHERE g.id = :id AND g.user.uid = :userUid")
    Optional<Goal> findByIdAndUserUidWithChildren(UUID id, String userUid);

    Optional<Goal> findByIdAndUserUid(UUID id, String userUid);
}
