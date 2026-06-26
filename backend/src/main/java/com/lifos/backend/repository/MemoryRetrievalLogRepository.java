package com.lifos.backend.repository;

import com.lifos.backend.entity.MemoryRetrievalLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MemoryRetrievalLogRepository extends JpaRepository<MemoryRetrievalLog, UUID> {
}
