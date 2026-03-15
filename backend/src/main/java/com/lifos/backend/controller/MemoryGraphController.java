package com.lifos.backend.controller;

import com.lifos.backend.entity.ConversationMemory;
import com.lifos.backend.entity.MemoryRelationship;
import com.lifos.backend.repository.ConversationMemoryRepository;
import com.lifos.backend.repository.MemoryRelationshipRepository;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.MemoryGraphService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Exposes the memory graph for frontend visualization.
 *
 * <ul>
 *   <li>{@code GET /api/ai/graph/nodes} — active memory nodes with visual status</li>
 *   <li>{@code GET /api/ai/graph/edges} — all MemoryRelationship links</li>
 * </ul>
 *
 * <p>The frontend uses node status + edge confidence to render Supermemory-style
 * hexagon graphs with color-coded lifecycle states.
 */
@RestController
@RequestMapping({"/ai/graph", "/api/ai/graph"})
@RequiredArgsConstructor
public class MemoryGraphController {

    private static final int MAX_NODES = 200;

    private final ConversationMemoryRepository memoryRepository;
    private final MemoryRelationshipRepository relationshipRepository;
    private final MemoryGraphService memoryGraphService;

    /**
     * Returns active memory nodes for the current user.
     * Includes computed {@code status} for visual differentiation.
     */
    @GetMapping("/nodes")
    public List<MemoryNodeResponse> getNodes() {
        String userUid = SecurityUtils.getCurrentUserUid();
        List<ConversationMemory> memories =
                memoryRepository.findLatestActiveByUserUid(userUid, PageRequest.of(0, MAX_NODES));

        return memories.stream()
                .map(m -> new MemoryNodeResponse(
                        m.getId(),
                        m.getMemoryText(),
                        m.getCategory(),
                        m.getDomain(),
                        m.getMemoryType() != null ? m.getMemoryType() : "dynamic",
                        m.getExpiresAt(),
                        m.getSessionId(),
                        m.getOverallConfidence(),
                        m.getCreatedAt(),
                        m.getUpdatedAt(),
                        memoryGraphService.computeStatus(m)
                ))
                .toList();
    }

    /**
     * Returns all memory relationship edges for the current user.
     * Confidence values are included for client-side edge weight computation.
     */
    @GetMapping("/edges")
    public List<MemoryEdgeResponse> getEdges() {
        String userUid = SecurityUtils.getCurrentUserUid();
        List<MemoryRelationship> relationships = relationshipRepository.findByUserUid(userUid);

        return relationships.stream()
                .map(r -> new MemoryEdgeResponse(
                        r.getId(),
                        r.getFromMemory().getId(),
                        r.getToMemory().getId(),
                        r.getRelationshipType(),
                        r.getConfidence(),
                        r.getReason(),
                        r.getCreatedAt()
                ))
                .toList();
    }

    // ── Response DTOs ─────────────────────────────────────────────────────────

    public record MemoryNodeResponse(
            UUID id,
            String memoryText,
            String category,
            String domain,
            String memoryType,
            Instant expiresAt,
            UUID sessionId,
            Float confidence,
            Instant createdAt,
            Instant updatedAt,
            /** One of: "active", "new", "expiring", "forgotten" */
            String status
    ) {}

    public record MemoryEdgeResponse(
            UUID id,
            UUID fromMemoryId,
            UUID toMemoryId,
            /** One of: "updates", "extends", "derives", "supersedes", "refines", "related" */
            String relationshipType,
            Float confidence,
            String reason,
            Instant createdAt
    ) {}
}
