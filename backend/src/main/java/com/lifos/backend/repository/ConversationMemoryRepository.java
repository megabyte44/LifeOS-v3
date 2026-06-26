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

    // ── Memory graph queries (Phase 2) ──────────────────────────────────────

    /** N most recently updated live head memories — used for extraction context. */
    @Query("SELECT m FROM ConversationMemory m WHERE m.user.uid = :userUid " +
           "AND m.active = true AND m.isLatest = true AND m.forgotten = false " +
           "ORDER BY m.updatedAt DESC")
    List<ConversationMemory> findLatestActiveByUserUid(@Param("userUid") String userUid,
                                                       Pageable pageable);

    /** Static (long-term profile) head memories ordered by confidence. */
    @Query("SELECT m FROM ConversationMemory m WHERE m.user.uid = :userUid " +
           "AND m.active = true AND m.isLatest = true AND m.forgotten = false " +
           "AND m.memoryType = 'static' ORDER BY m.overallConfidence DESC")
    List<ConversationMemory> findStaticProfileMemories(@Param("userUid") String userUid);

    /** Dynamic (recent context) head memories ordered by recency. */
    @Query("SELECT m FROM ConversationMemory m WHERE m.user.uid = :userUid " +
           "AND m.active = true AND m.isLatest = true AND m.forgotten = false " +
           "AND m.memoryType = 'dynamic' ORDER BY m.updatedAt DESC")
    List<ConversationMemory> findDynamicContextMemories(@Param("userUid") String userUid,
                                                        Pageable pageable);

    /** Bulk-expire memories whose expires_at has passed. Used by MemoryLifecycleService. */
    @Modifying
    @Query("UPDATE ConversationMemory m SET m.forgotten = true, m.isLatest = false, " +
           "m.updatedAt = :now WHERE m.forgotten = false AND m.expiresAt IS NOT NULL " +
           "AND m.expiresAt < :now")
    int expireStaleMemories(@Param("now") Instant now);
}
