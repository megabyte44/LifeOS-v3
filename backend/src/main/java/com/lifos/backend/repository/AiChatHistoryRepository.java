package com.lifos.backend.repository;

import com.lifos.backend.entity.AiChatHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
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

    @Query("SELECT COUNT(h) FROM AiChatHistory h WHERE h.user.uid = :userUid")
    long countByUserUid(@Param("userUid") String userUid);

    @Query(value = """
            SELECT DATE(created_at AT TIME ZONE 'UTC') AS day, COUNT(*) AS cnt
            FROM ai_chat_history
            WHERE created_at >= :since
            GROUP BY day
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> countMessagesByDay(@Param("since") Instant since);

    @Query(value = """
            SELECT h.user_uid, u.email, u.display_name, COUNT(*) AS cnt
            FROM ai_chat_history h
            JOIN users u ON u.uid = h.user_uid
            WHERE h.created_at >= :since
            GROUP BY h.user_uid, u.email, u.display_name
            ORDER BY cnt DESC
            LIMIT 10
            """, nativeQuery = true)
    List<Object[]> countMessagesByUser(@Param("since") Instant since);
}
