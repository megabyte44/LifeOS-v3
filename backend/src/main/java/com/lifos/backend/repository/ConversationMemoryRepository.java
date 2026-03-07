package com.lifos.backend.repository;

import com.lifos.backend.entity.ConversationMemory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ConversationMemoryRepository extends JpaRepository<ConversationMemory, UUID> {
    List<ConversationMemory> findByUserUidAndActiveTrueOrderByCreatedAtDesc(String userUid, Pageable pageable);
}
