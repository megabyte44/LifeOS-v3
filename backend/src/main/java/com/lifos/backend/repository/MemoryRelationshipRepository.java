package com.lifos.backend.repository;

import com.lifos.backend.entity.MemoryRelationship;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MemoryRelationshipRepository extends JpaRepository<MemoryRelationship, UUID> {
}
