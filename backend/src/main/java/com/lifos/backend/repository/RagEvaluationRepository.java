package com.lifos.backend.repository;

import com.lifos.backend.entity.RagEvaluation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface RagEvaluationRepository extends JpaRepository<RagEvaluation, UUID> {

    Page<RagEvaluation> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT e FROM RagEvaluation e WHERE e.createdAt >= :since ORDER BY e.createdAt DESC")
    List<RagEvaluation> findSince(@Param("since") Instant since);

    @Query("SELECT COUNT(e) FROM RagEvaluation e WHERE e.user.uid = :userUid AND e.createdAt >= :since")
    long countByUserUidSince(@Param("userUid") String userUid, @Param("since") Instant since);
}
