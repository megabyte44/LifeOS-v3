package com.lifos.backend.repository;

import com.lifos.backend.entity.ConversationMemory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface ConversationMemoryRepository extends JpaRepository<ConversationMemory, UUID> {
    List<ConversationMemory> findByUserUidAndActiveTrueOrderByCreatedAtDesc(String userUid, Pageable pageable);

    /** Returns ALL active memories for a user — used to build extraction context. */
    List<ConversationMemory> findByUserUidAndActiveTrueOrderByCreatedAtAsc(String userUid);

    /** Deactivates all active memories in a given category for a user before replacing them. */
    @Modifying
    @Query("UPDATE ConversationMemory m SET m.active = false WHERE m.user.uid = :userUid AND m.category = :category AND m.active = true")
    void deactivateByUserUidAndCategory(@Param("userUid") String userUid, @Param("category") String category);
}
