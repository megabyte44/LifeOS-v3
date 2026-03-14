package com.lifos.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lifos.backend.config.AiFoundationProperties;
import com.lifos.backend.entity.KnowledgeEdge;
import com.lifos.backend.entity.User;
import com.lifos.backend.repository.KnowledgeEdgeRepository;
import com.lifos.backend.repository.KnowledgeEdgeRepository.GraphNeighborProjection;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Knowledge-graph service with two main capabilities:
 * 1. Edge extraction — async after entity save; LLM identifies relationships.
 * 2. Graph traversal — called during retrieval; BFS walk returning scored neighbors.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeGraphService {

    private static final Set<String> VALID_RELATIONSHIPS = Set.of(
            "related_to", "supports", "blocks", "part_of", "motivated_by",
            "tracks", "contradicts", "supersedes", "finances", "scheduled_for"
    );

    private final KnowledgeEdgeRepository knowledgeEdgeRepository;
    private final UserRepository userRepository;
    private final EmbeddingService embeddingService;
    private final AiFoundationProperties aiFoundationProperties;
    private final AiConfigurationResolver aiConfigurationResolver;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public record NodeKey(String type, UUID id) {}
    public record GraphScore(float score, int hops) {}

    // ── Edge Extraction ──────────────────────────────────────────────────

    @Transactional
    public void extractEdges(String userUid, String sourceType, UUID sourceId, String entityText) {
        if (!aiFoundationProperties.getRag().isEnableEdgeExtraction()) {
            log.debug("Edge extraction disabled, skipping for {} {}", sourceType, sourceId);
            return;
        }

        String apiKey = resolveExtractionApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.debug("No API key available for KG edge extraction, skipping.");
            return;
        }

        User user = userRepository.findById(userUid).orElse(null);
        if (user == null) {
            log.warn("User [{}] not found during KG edge extraction, skipping.", userUid);
            return;
        }

        try {
            List<EmbeddingService.EmbeddingCandidate> candidates =
                    embeddingService.searchCandidates(userUid, entityText, 5);

            String prompt = buildExtractionPrompt(sourceType, sourceId, entityText, candidates);
            List<EdgeCandidate> edges = callExtractionApi(apiKey, prompt);

            if (edges.isEmpty()) {
                log.debug("No KG edges extracted for {} {}", sourceType, sourceId);
                return;
            }

            int storedCount = 0;
            for (EdgeCandidate edge : edges) {
                if (!VALID_RELATIONSHIPS.contains(edge.relationship())) {
                    continue;
                }
                KnowledgeEdge ke = KnowledgeEdge.builder()
                        .user(user)
                        .fromType(edge.fromType())
                        .fromId(edge.fromId())
                        .toType(edge.toType())
                        .toId(edge.toId())
                        .relationship(edge.relationship())
                        .confidence(clamp(edge.confidence()))
                        .reason(edge.reason())
                        .extractionModel(resolveExtractionModelName())
                        .active(true)
                        .build();
                knowledgeEdgeRepository.save(ke);
                storedCount++;
            }
            log.info("KG edge extraction for {} {}: stored {} edges", sourceType, sourceId, storedCount);
        } catch (Exception ex) {
            log.warn("KG edge extraction failed for {} {}: {}", sourceType, sourceId, ex.getMessage());
        }
    }

    // ── Graph Traversal ──────────────────────────────────────────────────

    public Map<NodeKey, GraphScore> traverseGraph(String userUid, List<NodeKey> seedNodes) {
        if (!aiFoundationProperties.getRag().isEnableKnowledgeGraph()) {
            return Collections.emptyMap();
        }
        if (seedNodes == null || seedNodes.isEmpty()) {
            return Collections.emptyMap();
        }

        int maxHops = aiFoundationProperties.getRag().getGraphMaxHops();
        String[] seedTypes = seedNodes.stream().map(NodeKey::type).toArray(String[]::new);
        UUID[] seedIds = seedNodes.stream().map(NodeKey::id).toArray(UUID[]::new);

        List<GraphNeighborProjection> neighbors = knowledgeEdgeRepository.walkGraph(
                userUid, seedTypes, seedIds, maxHops, 50);

        Map<NodeKey, GraphScore> result = new LinkedHashMap<>();
        for (GraphNeighborProjection n : neighbors) {
            NodeKey key = new NodeKey(n.getNodeType(), n.getNodeId());
            int depth = n.getMinDepth();
            float confidence = n.getMaxConfidence() != null ? n.getMaxConfidence() : 0.7f;
            float score = (float) Math.pow(0.5, depth) * confidence;
            result.put(key, new GraphScore(score, depth));
        }
        log.debug("Graph traversal from {} seeds returned {} neighbors", seedNodes.size(), result.size());
        return result;
    }

    // ── Extraction prompt ────────────────────────────────────────────────

    private String buildExtractionPrompt(String sourceType, UUID sourceId, String entityText,
                                          List<EmbeddingService.EmbeddingCandidate> candidates) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
                You are a knowledge-graph edge extraction engine for a personal life-management app.
                Your ONLY job is to identify relationships between the SOURCE entity and CANDIDATE entities.

                RULES:
                - Only extract edges where a meaningful relationship exists.
                - Each edge must connect the SOURCE to one of the CANDIDATES.
                - Valid relationship types (use ONLY these exact strings):
                  related_to, supports, blocks, part_of, motivated_by, tracks, contradicts, supersedes, finances, scheduled_for
                - If no meaningful relationships exist, return an empty array [].
                - Confidence should be between 0.5 and 1.0.
                - Keep reason brief (under 80 chars).

                OUTPUT FORMAT (strict JSON array, no markdown, no explanation):
                [{"from_type":"...","from_id":"...","to_type":"...","to_id":"...","relationship":"...","confidence":0.8,"reason":"..."}]

                """);
        sb.append("SOURCE ENTITY:\n");
        sb.append("  type: ").append(sourceType).append("\n");
        sb.append("  id: ").append(sourceId).append("\n");
        sb.append("  text: ").append(entityText).append("\n\n");

        if (!candidates.isEmpty()) {
            sb.append("CANDIDATE ENTITIES:\n");
            for (EmbeddingService.EmbeddingCandidate c : candidates) {
                if (c.sourceType().equals(sourceType) && c.sourceId().equals(sourceId)) continue;
                sb.append("  - type: ").append(c.sourceType())
                        .append(", id: ").append(c.sourceId())
                        .append(", preview: ").append(c.contentPreview())
                        .append("\n");
            }
        }
        return sb.toString();
    }

    // ── API call ─────────────────────────────────────────────────────────

    private List<EdgeCandidate> callExtractionApi(String apiKey, String prompt) {
        String provider = resolveExtractionProvider();
        String model = resolveExtractionModelName();
        String url = provider.equals("openai")
                ? "https://api.openai.com/v1/chat/completions"
                : "https://openrouter.ai/api/v1/chat/completions";

        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            body.put("temperature", 0.2);
            body.put("max_tokens", 1024);
            body.putArray("messages")
                    .addObject().put("role", "user").put("content", prompt);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            if (provider.equals("openrouter")) {
                headers.set("HTTP-Referer", "https://lifeos.app");
            }

            ResponseEntity<String> resp = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(objectMapper.writeValueAsString(body), headers),
                    String.class);

            if (resp.getStatusCode() == HttpStatus.OK && resp.getBody() != null) {
                JsonNode root = objectMapper.readTree(resp.getBody());
                String content = root.path("choices").get(0)
                        .path("message").path("content").asText("");
                return parseEdgeCandidates(content);
            }
        } catch (Exception e) {
            log.warn("KG extraction API call failed: {}", e.getMessage());
        }
        return List.of();
    }

    private List<EdgeCandidate> parseEdgeCandidates(String raw) {
        String cleaned = raw.strip();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("```[a-z]*\\s*", "").replaceAll("```$", "").strip();
        }

        List<EdgeCandidate> result = new ArrayList<>();
        try {
            JsonNode arr = objectMapper.readTree(cleaned);
            if (!arr.isArray()) return result;

            for (JsonNode node : arr) {
                String fromType     = node.path("from_type").asText("").strip();
                String fromIdStr    = node.path("from_id").asText("").strip();
                String toType       = node.path("to_type").asText("").strip();
                String toIdStr      = node.path("to_id").asText("").strip();
                String relationship = node.path("relationship").asText("").strip().toLowerCase();
                float  confidence   = (float) node.path("confidence").asDouble(0.7);
                String reason       = node.path("reason").asText("").strip();

                if (fromType.isBlank() || toType.isBlank() || fromIdStr.isBlank() || toIdStr.isBlank()) continue;
                try {
                    result.add(new EdgeCandidate(fromType, UUID.fromString(fromIdStr),
                            toType, UUID.fromString(toIdStr), relationship, confidence, reason));
                } catch (IllegalArgumentException e) {
                    log.debug("Skipping edge with invalid UUID: from={}, to={}", fromIdStr, toIdStr);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse KG extraction JSON: {}", e.getMessage());
        }
        return result;
    }

    // ── Provider resolution ──────────────────────────────────────────────

    private String resolveExtractionProvider() {
        var config = aiConfigurationResolver.resolve();
        String configured = (String) config.getModelConfig().getOrDefault("provider", "openrouter");
        return configured.equals("gemini") ? "openrouter" : configured;
    }

    private String resolveExtractionModelName() {
        String provider = resolveExtractionProvider();
        return provider.equals("openai") ? "gpt-4o-mini" : "openai/gpt-4o-mini";
    }

    private String resolveExtractionApiKey() {
        var config = aiConfigurationResolver.resolve();
        String provider = resolveExtractionProvider();
        return aiConfigurationResolver.resolveProviderApiKey(provider, config.getApiKeys());
    }

    private float clamp(float score) {
        return Math.max(0f, Math.min(1f, score));
    }

    private record EdgeCandidate(
            String fromType, UUID fromId, String toType, UUID toId,
            String relationship, float confidence, String reason
    ) {}
}
