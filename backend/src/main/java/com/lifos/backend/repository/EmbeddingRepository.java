package com.lifos.backend.repository;

import com.lifos.backend.entity.Embedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
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

    @Query(value = "SELECT e.id AS id, e.source_type AS sourceType, e.source_id AS sourceId, " +
                   "e.content_preview AS contentPreview, e.updated_at AS updatedAt, e.domain AS domain, " +
                   "e.domain_tag AS domainTag, " +
                   "e.embedding_quality_score AS embeddingQualityScore, e.recency_weight AS recencyWeight, " +
                   "e.importance_signal AS importanceSignal, " +
                   "(1 - (e.embedding <=> CAST(:queryVector AS vector))) AS similarity " +
                   "FROM embeddings e " +
                   "WHERE e.user_uid = :userUid " +
                   "AND e.embedding IS NOT NULL " +
                   "AND (:filterByType = false OR e.source_type = ANY(CAST(:sourceTypes AS text[]))) " +
                   "ORDER BY e.embedding <=> CAST(:queryVector AS vector) " +
                   "LIMIT :limit", nativeQuery = true)
    List<EmbeddingSearchProjection> findSimilarCandidates(@Param("userUid") String userUid,
                                                          @Param("queryVector") String queryVector,
                                                          @Param("filterByType") boolean filterByType,
                                                          @Param("sourceTypes") String[] sourceTypes,
                                                          @Param("limit") int limit);

    @Modifying
    @Query("UPDATE Embedding e SET e.lastUsedInContext = :usedAt WHERE e.id IN :ids")
    void touchLastUsed(@Param("ids") List<UUID> ids, @Param("usedAt") Instant usedAt);

    interface EmbeddingSearchProjection {
        UUID getId();
        String getSourceType();
        UUID getSourceId();
        String getContentPreview();
        Instant getUpdatedAt();
        String getDomain();
        String getDomainTag();
        Float getEmbeddingQualityScore();
        Float getRecencyWeight();
        Float getImportanceSignal();
        Double getSimilarity();
    }
}
