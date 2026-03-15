package com.lifos.backend.repository;

import com.lifos.backend.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AiConversationRepository extends JpaRepository<AiConversation, UUID> {

    @Query("SELECT c FROM AiConversation c WHERE c.user.uid = :userUid " +
           "AND c.deleted = false AND c.lastMessageAt IS NOT NULL " +
           "ORDER BY c.lastMessageAt DESC")
    List<AiConversation> findActiveByUserUid(@Param("userUid") String userUid);

    Optional<AiConversation> findByIdAndDeletedFalse(UUID id);

    @Modifying
    @Query("UPDATE AiConversation c SET c.deleted = true, c.updatedAt = CURRENT_TIMESTAMP " +
           "WHERE c.user.uid = :userUid AND c.deleted = false")
    void softDeleteAllByUserUid(@Param("userUid") String userUid);
}
