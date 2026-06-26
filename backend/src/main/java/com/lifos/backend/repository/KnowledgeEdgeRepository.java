package com.lifos.backend.repository;

import com.lifos.backend.entity.KnowledgeEdge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface KnowledgeEdgeRepository extends JpaRepository<KnowledgeEdge, UUID> {

    /** Find all active edges FROM a given node (1-hop outgoing). */
    @Query(value = """
        SELECT * FROM knowledge_edges
        WHERE user_uid = :userUid AND active = true
          AND from_type = :fromType AND from_id = :fromId
        """, nativeQuery = true)
    List<KnowledgeEdge> findOutgoing(@Param("userUid") String userUid,
                                     @Param("fromType") String fromType,
                                     @Param("fromId") UUID fromId);

    /** Find all active edges TO a given node (1-hop incoming). */
    @Query(value = """
        SELECT * FROM knowledge_edges
        WHERE user_uid = :userUid AND active = true
          AND to_type = :toType AND to_id = :toId
        """, nativeQuery = true)
    List<KnowledgeEdge> findIncoming(@Param("userUid") String userUid,
                                     @Param("toType") String toType,
                                     @Param("toId") UUID toId);

    /**
     * Multi-hop BFS traversal from a set of seed nodes.
     * Returns distinct reachable nodes with their minimum distance and max confidence.
     */
    @Query(value = """
        WITH RECURSIVE graph_walk AS (
            -- Hop 0: edges from seed nodes (outgoing)
            SELECT ke.to_type AS node_type, ke.to_id AS node_id,
                   ke.confidence, 1 AS depth
            FROM knowledge_edges ke
            WHERE ke.user_uid = :userUid AND ke.active = true
              AND ke.from_type = ANY(CAST(:seedTypes AS text[]))
              AND ke.from_id = ANY(CAST(:seedIds AS uuid[]))

            UNION ALL

            -- Hop N+1: follow outgoing edges from discovered nodes
            SELECT ke.to_type, ke.to_id,
                   ke.confidence, gw.depth + 1
            FROM knowledge_edges ke
            JOIN graph_walk gw ON ke.from_type = gw.node_type AND ke.from_id = gw.node_id
            WHERE ke.user_uid = :userUid AND ke.active = true
              AND gw.depth < :maxHops
        )
        SELECT node_type AS nodeType, node_id AS nodeId,
               MIN(depth) AS minDepth, MAX(confidence) AS maxConfidence
        FROM graph_walk
        GROUP BY node_type, node_id
        ORDER BY MIN(depth) ASC, MAX(confidence) DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<GraphNeighborProjection> walkGraph(
            @Param("userUid") String userUid,
            @Param("seedTypes") String[] seedTypes,
            @Param("seedIds") UUID[] seedIds,
            @Param("maxHops") int maxHops,
            @Param("limit") int limit);

    /** Soft-delete all edges involving a specific node (both directions). */
    @Modifying
    @Query("""
        UPDATE KnowledgeEdge e SET e.active = false, e.updatedAt = CURRENT_TIMESTAMP
        WHERE e.user.uid = :userUid
          AND ((e.fromType = :nodeType AND e.fromId = :nodeId)
            OR (e.toType = :nodeType AND e.toId = :nodeId))
        """)
    void deactivateEdgesForNode(@Param("userUid") String userUid,
                                @Param("nodeType") String nodeType,
                                @Param("nodeId") UUID nodeId);

    /** Projection for graph walk results. */
    interface GraphNeighborProjection {
        String getNodeType();
        UUID getNodeId();
        Integer getMinDepth();
        Float getMaxConfidence();
    }
}
