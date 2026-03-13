package com.lifos.backend.repository;

import com.lifos.backend.entity.Embedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmbeddingRepository extends JpaRepository<Embedding, UUID> {
    
    Optional<Embedding> findBySourceTypeAndSourceId(String sourceType, UUID sourceId);
    
    void deleteBySourceTypeAndSourceId(String sourceType, UUID sourceId);

    @Query(value = "SELECT * FROM embeddings e " +
                   "WHERE e.user_uid = :userUid " +
                   "ORDER BY e.embedding <=> CAST(:queryVector AS vector) " +
                   "LIMIT :limit", nativeQuery = true)
    List<Embedding> findSimilar(@Param("userUid") String userUid,
                                @Param("queryVector") String queryVector,
                                @Param("limit") int limit);
}
