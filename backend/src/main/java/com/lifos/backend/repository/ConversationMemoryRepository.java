package com.lifos.backend.repository;

import com.lifos.backend.entity.ConversationMemory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationMemoryRepository extends JpaRepository<ConversationMemory, UUID> {
    List<ConversationMemory> findByUserUidAndActiveTrueOrderByCreatedAtDesc(String userUid, Pageable pageable);

    List<ConversationMemory> findByUserUidAndActiveTrueOrderByUpdatedAtDesc(String userUid, Pageable pageable);

    /** Returns ALL active memories for a user — used to build extraction context. */
    List<ConversationMemory> findByUserUidAndActiveTrueOrderByCreatedAtAsc(String userUid);

    Optional<ConversationMemory> findByUserUidAndMemoryHashAndActiveTrue(String userUid, String memoryHash);

    List<ConversationMemory> findByUserUidAndIdIn(String userUid, List<UUID> ids);

    @Modifying
    @Query("UPDATE ConversationMemory m SET m.accessCount = COALESCE(m.accessCount, 0) + 1, " +
           "m.lastAccessedAt = :accessedAt, m.updatedAt = :accessedAt WHERE m.id IN :ids AND m.user.uid = :userUid")
    void touchAccess(@Param("userUid") String userUid,
                     @Param("ids") List<UUID> ids,
                     @Param("accessedAt") Instant accessedAt);
}
