package com.lifos.backend.repository;

import com.lifos.backend.entity.RagTestCase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RagTestCaseRepository extends JpaRepository<RagTestCase, UUID> {
}
