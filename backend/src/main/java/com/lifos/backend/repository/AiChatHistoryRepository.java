package com.lifos.backend.repository;

import com.lifos.backend.entity.AiChatHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AiChatHistoryRepository extends JpaRepository<AiChatHistory, UUID> {
    List<AiChatHistory> findByUserUidOrderByCreatedAtDesc(String userUid, Pageable pageable);

    @Modifying
    @Query("DELETE FROM AiChatHistory h WHERE h.user.uid = :userUid")
    void deleteAllByUserUid(@Param("userUid") String userUid);

    @Query("SELECT h FROM AiChatHistory h WHERE h.conversation.id = :conversationId " +
           "ORDER BY h.createdAt ASC")
    List<AiChatHistory> findByConversationIdOrderByCreatedAtAsc(@Param("conversationId") UUID conversationId);
}
