package com.lifos.backend.repository;

import com.lifos.backend.entity.MemoryRelationship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MemoryRelationshipRepository extends JpaRepository<MemoryRelationship, UUID> {

    /** All edges belonging to a user — used for graph visualization. */
    @Query("SELECT r FROM MemoryRelationship r WHERE r.user.uid = :userUid " +
           "ORDER BY r.createdAt DESC")
    List<MemoryRelationship> findByUserUid(@Param("userUid") String userUid);
}
