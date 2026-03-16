package com.lifos.backend.service;

import com.lifos.backend.config.AiFoundationProperties;
import com.lifos.backend.entity.ConversationMemory;
import com.lifos.backend.entity.Embedding;
import com.lifos.backend.entity.MemoryRetrievalLog;
import com.lifos.backend.entity.User;
import com.lifos.backend.repository.ConversationMemoryRepository;
import com.lifos.backend.repository.KnowledgeEdgeRepository;
import com.lifos.backend.repository.MemoryRetrievalLogRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemoryRetrievalStrategyService {

    // Reduced from 120 → 60: MemoryGraphService.generateProfile() now handles global
    // facts via the static/dynamic profile block, so this pool only needs to cover
    // query-relevant memories for BM25+vector hybrid scoring.
    private static final int MEMORY_CANDIDATE_LIMIT = 60;
    private static final int VECTOR_CANDIDATE_LIMIT = 30;
    private static final int MAX_LOGGED_CANDIDATES = 40;
    // Reduced from 50 → 30 for the same reason (legacy path).
    private static final int LEGACY_MEMORY_LIMIT = 30;
    private static final int GRAPH_SEED_COUNT = 5;

    private final AiFoundationProperties aiFoundationProperties;
    private final ConversationMemoryRepository conversationMemoryRepository;
    private final MemoryRetrievalLogRepository memoryRetrievalLogRepository;
    private final UserRepository userRepository;
    private final EmbeddingService embeddingService;

    @Autowired(required = false)
    private KnowledgeEdgeRepository knowledgeEdgeRepository;

    @Autowired(required = false)
    private QueryIntentClassifier queryIntentClassifier;

    @Transactional
    public RetrievalPlan buildPlan(String userUid, String userQuery) {
        if (userQuery == null || userQuery.isBlank()) {
            return RetrievalPlan.empty();
        }

        if (!aiFoundationProperties.getRag().isEnableHybridReads()) {
            return buildLegacyPlan(userUid, userQuery);
        }

        List<ConversationMemory> memories = conversationMemoryRepository
                .findByUserUidAndActiveTrueOrderByUpdatedAtDesc(userUid, PageRequest.of(0, MEMORY_CANDIDATE_LIMIT));

        List<EmbeddingService.EmbeddingCandidate> vectors;
        try {
            vectors = embeddingService.searchCandidates(userUid, userQuery, VECTOR_CANDIDATE_LIMIT);
        } catch (Exception ex) {
            log.warn("Hybrid retrieval vector pass failed for user {}: {}", userUid, ex.getMessage());
            vectors = List.of();
        }

        Set<String> queryTerms = tokenize(userQuery);
        Map<UUID, Double> memoryVectorScore = vectors.stream()
                .filter(v -> "conversation_memory".equals(v.sourceType()))
                .collect(Collectors.toMap(
                        EmbeddingService.EmbeddingCandidate::sourceId,
                        EmbeddingService.EmbeddingCandidate::similarity,
                        Math::max));

        boolean graphEnabled = aiFoundationProperties.getRag().isEnableGraphBoostedScoring()
                && knowledgeEdgeRepository != null;

        List<Candidate> candidates = new ArrayList<>();

        for (ConversationMemory memory : memories) {
            double vectorScore = clamp(memoryVectorScore.getOrDefault(memory.getId(), 0.0));
            double structuredScore = bm25Score(queryTerms, memory.getMemoryText(), memory.getDomain(), memory.getCategory());
            double recency = recencyScore(memory.getUpdatedAt() != null ? memory.getUpdatedAt() : memory.getCreatedAt());
            double importance = clamp(avg(memory.getRelevanceScore(), memory.getTimelinessScore()));
            double confidence = clamp(scoreOrDefault(
                memory.getOverallConfidence() != null ? memory.getOverallConfidence() : memory.getConfidence(),
                0.7));
            double access = accessBoost(memory.getAccessCount());

            double score;
            if (graphEnabled) {
                // With graph: vector gets 0.30 (graph takes 0.10)
                score = (0.30 * vectorScore) + (0.20 * structuredScore) + (0.15 * recency)
                        + (0.10 * importance) + (0.10 * confidence) + (0.05 * access);
            } else {
                // Without graph: vector gets full 0.35 + structuredScore gets 0.25
                score = (0.35 * vectorScore) + (0.25 * structuredScore) + (0.15 * recency)
                        + (0.10 * importance) + (0.10 * confidence) + (0.05 * access);
            }

            candidates.add(Candidate.fromMemory(memory, score, vectorScore, structuredScore, recency, importance, confidence));
        }

        for (EmbeddingService.EmbeddingCandidate embedding : vectors) {
            double vectorScore = clamp(embedding.similarity());
            double structuredScore = bm25Score(queryTerms, embedding.contentPreview(), embedding.domain(), embedding.sourceType());
            double recency = recencyScore(embedding.updatedAt()) * clamp(embedding.recencyWeight());
            double importance = clamp(embedding.importanceSignal());
            double confidence = clamp(embedding.qualityScore());

            double score;
            if (graphEnabled) {
                // With graph: vector gets 0.35 (graph takes 0.15)
                score = (0.35 * vectorScore) + (0.20 * structuredScore) + (0.10 * recency)
                        + (0.10 * importance) + (0.10 * confidence);
            } else {
                // Without graph: vector gets full 0.45
                score = (0.45 * vectorScore) + (0.20 * structuredScore) + (0.15 * recency)
                        + (0.10 * importance) + (0.10 * confidence);
            }

            candidates.add(Candidate.fromEmbedding(embedding, score, vectorScore, structuredScore, recency, importance, confidence));
        }

        // Graph boost pass: take top seeds, traverse graph, boost connected candidates
        if (graphEnabled) {
            candidates = applyGraphBoost(userUid, candidates);
        }

        candidates.sort(Comparator.comparingDouble(Candidate::score).reversed());

        int budget = aiFoundationProperties.getRag().isEnableDynamicTopK()
            ? computeTokenBudget(userQuery)
            : legacyTokenBudget();
        int dynamicCap = aiFoundationProperties.getRag().isEnableDynamicTopK()
            ? computeDynamicCap(userQuery)
            : legacyDynamicCap();
        int minK = 6;

        List<Candidate> selected = new ArrayList<>();
        int usedTokens = 0;

        for (Candidate candidate : candidates) {
            if (selected.size() >= dynamicCap) {
                break;
            }
            if (usedTokens + candidate.tokenEstimate() > budget && selected.size() >= minK) {
                continue;
            }
            selected.add(candidate);
            usedTokens += candidate.tokenEstimate();
        }

        if (selected.size() < minK) {
            for (Candidate candidate : candidates) {
                if (selected.size() >= minK || selected.size() >= dynamicCap) {
                    break;
                }
                if (!selected.contains(candidate)) {
                    selected.add(candidate);
                    usedTokens += candidate.tokenEstimate();
                }
            }
        }

        // Classify intent for observability and selective context
        Set<QueryIntentClassifier.Intent> intents = Set.of(QueryIntentClassifier.Intent.GENERAL);
        if (aiFoundationProperties.getRag().isEnableQueryIntentClassification()
                && queryIntentClassifier != null) {
            intents = queryIntentClassifier.classify(userQuery);
        }
        String intentStr = intents.stream()
                .map(Enum::name)
                .sorted()
                .collect(Collectors.joining(","));

        persistObservability(userUid, userQuery, candidates, selected, intentStr);

        List<String> memoryLines = selected.stream()
                .filter(c -> c.kind() == CandidateKind.MEMORY)
                .map(c -> "- [" + c.domain() + "] " + c.text())
                .toList();

        List<String> vectorLines = selected.stream()
                .filter(c -> c.kind() == CandidateKind.EMBEDDING)
                .map(c -> "- [" + c.sourceType() + "] " + c.text())
                .toList();

        return new RetrievalPlan(memoryLines, vectorLines, usedTokens, selected.size(), budget, intents);
    }

    private RetrievalPlan buildLegacyPlan(String userUid, String userQuery) {
        List<ConversationMemory> memories = conversationMemoryRepository
                .findByUserUidAndActiveTrueOrderByCreatedAtDesc(userUid, PageRequest.of(0, LEGACY_MEMORY_LIMIT));

        int vectorLimit = Math.max(1, aiFoundationProperties.getRag().getDefaultVectorLimit());
        List<Embedding> similar = List.of();
        try {
            similar = embeddingService.searchSimilar(userUid, userQuery, vectorLimit);
        } catch (Exception ex) {
            log.warn("Legacy vector retrieval failed for user {}: {}", userUid, ex.getMessage());
        }

        List<String> memoryLines = memories.stream()
                .map(m -> {
                    String domain = m.getDomain() != null ? m.getDomain()
                            : (m.getCategory() != null ? m.getCategory() : "context");
                    return "- [" + domain + "] " + (m.getMemoryText() == null ? "" : m.getMemoryText());
                })
                .toList();

        List<String> vectorLines = similar.stream()
                .map(e -> "- [" + e.getSourceType() + "] " + (e.getContentPreview() == null ? "" : e.getContentPreview()))
                .toList();

        int usedTokens = memoryLines.stream().mapToInt(this::estimateTokens).sum()
                + vectorLines.stream().mapToInt(this::estimateTokens).sum();
        int tokenBudget = legacyTokenBudget();
        int selectedCount = memoryLines.size() + vectorLines.size();

        return new RetrievalPlan(memoryLines, vectorLines, usedTokens, selectedCount, tokenBudget,
                Set.of(QueryIntentClassifier.Intent.GENERAL));
    }

    private void persistObservability(String userUid,
                                      String query,
                                      List<Candidate> ranked,
                                      List<Candidate> selected,
                                      String queryIntent) {
        if (ranked.isEmpty()) {
            return;
        }

        User user = userRepository.findById(userUid).orElse(null);
        if (user == null) {
            return;
        }

        Set<UUID> selectedMemoryIds = selected.stream()
                .map(Candidate::memoryId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());

        Set<UUID> selectedEmbeddingIds = selected.stream()
                .map(Candidate::embeddingId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());

        Instant now = Instant.now();
        List<Candidate> topForLog = ranked.size() > MAX_LOGGED_CANDIDATES
                ? ranked.subList(0, MAX_LOGGED_CANDIDATES)
                : ranked;

        List<MemoryRetrievalLog> rows = topForLog.stream()
                .map(c -> MemoryRetrievalLog.builder()
                        .user(user)
                        .queryText(query)
                        .memoryId(c.memoryId())
                        .embeddingId(c.embeddingId())
                        .sourceType(c.sourceType())
                        .rankingScore((float) c.score())
                        .vectorScore((float) c.vectorScore())
                        .structuredScore((float) c.structuredScore())
                        .recencyScore((float) c.recencyScore())
                        .importanceScore((float) c.importanceScore())
                        .confidenceScore((float) c.confidenceScore())
                        .graphScore((float) c.graphScore())
                        .queryIntent(queryIntent)
                        .selected(selected.contains(c))
                        .tokenEstimate(c.tokenEstimate())
                        .createdAt(now)
                        .build())
                .toList();

        memoryRetrievalLogRepository.saveAll(rows);

        if (!selectedMemoryIds.isEmpty()) {
            conversationMemoryRepository.touchAccess(userUid, List.copyOf(selectedMemoryIds), now);
        }
        if (!selectedEmbeddingIds.isEmpty()) {
            embeddingService.touchLastUsed(selectedEmbeddingIds);
        }
    }

    private int computeTokenBudget(String query) {
        int base = 1400;
        int complexityBonus = Math.min(500, estimateTokens(query) * 2);
        return Math.max(900, Math.min(1900, base + complexityBonus));
    }

    private int computeDynamicCap(String query) {
        int complexity = estimateTokens(query) > 30 || query.toLowerCase(Locale.ROOT).contains("compare") ? 3
                : estimateTokens(query) > 14 ? 2 : 1;
        int cap = 10 + (complexity * 4);
        return Math.max(8, Math.min(24, cap));
    }

    private int legacyTokenBudget() {
        int chunkCount = Math.max(1, aiFoundationProperties.getRag().getMaxContextChunks());
        return Math.max(800, Math.min(2000, chunkCount * 240));
    }

    private int legacyDynamicCap() {
        int chunkCount = Math.max(1, aiFoundationProperties.getRag().getMaxContextChunks());
        return Math.max(8, Math.min(24, chunkCount * 2));
    }

    /**
     * BM25-lite scoring — replaces naive keyword overlap with term-frequency-aware scoring.
     * Uses BM25 formula: tf*(k1+1) / (tf + k1*(1 - b + b*(docLen/avgDocLen)))
     * Normalized to 0-1 range.
     */
    private double bm25Score(Set<String> queryTerms, String text, String domain, String category) {
        if (queryTerms.isEmpty()) {
            return 0.2;
        }

        String combined = ((text == null ? "" : text) + " "
                + (domain == null ? "" : domain) + " "
                + (category == null ? "" : category)).toLowerCase(Locale.ROOT);

        String[] docTokens = combined.split("[^a-z0-9]+");
        int docLen = docTokens.length;
        if (docLen == 0) {
            return 0.0;
        }

        Map<String, Integer> termFreqs = new HashMap<>();
        for (String token : docTokens) {
            if (token.length() > 2) {
                termFreqs.merge(token, 1, Integer::sum);
            }
        }

        double k1 = 1.2;
        double b = 0.75;
        double avgDocLen = 50.0;
        double rawScore = 0.0;

        for (String term : queryTerms) {
            int tf = 0;
            for (var entry : termFreqs.entrySet()) {
                if (entry.getKey().contains(term) || term.contains(entry.getKey())) {
                    tf += entry.getValue();
                }
            }
            if (tf > 0) {
                rawScore += (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLen / avgDocLen)));
            }
        }

        double maxPossible = queryTerms.size() * ((k1 + 1) / 1.0);
        return clamp(rawScore / maxPossible);
    }

    private double recencyScore(Instant timestamp) {
        if (timestamp == null) {
            return 0.1;
        }
        long ageDays = Math.max(0, Duration.between(timestamp, Instant.now()).toDays());
        return Math.exp(-ageDays / 30.0);
    }

    private double accessBoost(Integer accessCount) {
        if (accessCount == null || accessCount <= 0) {
            return 0;
        }
        return Math.min(1.0, Math.log1p(accessCount) / 3.0);
    }

    /**
     * Graph boost pass: uses top-N candidates as seed nodes, walks the knowledge graph,
     * and boosts candidates connected to seeds by graph proximity.
     * Score decay: 0.5^depth * confidence.
     */
    private List<Candidate> applyGraphBoost(String userUid, List<Candidate> candidates) {
        // Sort by pre-graph score to pick seeds
        candidates.sort(Comparator.comparingDouble(Candidate::score).reversed());

        List<Candidate> seeds = candidates.stream()
                .limit(GRAPH_SEED_COUNT)
                .toList();

        List<String> seedTypes = new ArrayList<>();
        List<UUID> seedIds = new ArrayList<>();
        for (Candidate seed : seeds) {
            if (seed.memoryId() != null) {
                seedTypes.add("conversation_memory");
                seedIds.add(seed.memoryId());
            }
            if (seed.embeddingId() != null) {
                seedTypes.add(seed.sourceType());
                seedIds.add(seed.embeddingId());
            }
        }

        if (seedTypes.isEmpty()) {
            return candidates;
        }

        int maxHops = aiFoundationProperties.getRag().getGraphMaxHops();
        float graphWeight = aiFoundationProperties.getRag().getGraphBoostWeight();

        Map<String, Double> graphScores;
        try {
            List<KnowledgeEdgeRepository.GraphNeighborProjection> neighbors =
                    knowledgeEdgeRepository.walkGraph(
                            userUid,
                            seedTypes.toArray(String[]::new),
                            seedIds.toArray(UUID[]::new),
                            maxHops,
                            50);

            graphScores = new HashMap<>();
            for (var neighbor : neighbors) {
                String key = neighbor.getNodeType() + ":" + neighbor.getNodeId();
                double decayedScore = Math.pow(0.5, neighbor.getMinDepth())
                        * (neighbor.getMaxConfidence() != null ? neighbor.getMaxConfidence() : 0.5);
                graphScores.merge(key, decayedScore, Math::max);
            }
        } catch (Exception ex) {
            log.warn("Graph traversal failed for user {}: {}", userUid, ex.getMessage());
            return candidates;
        }

        List<Candidate> boosted = new ArrayList<>(candidates.size());
        for (Candidate c : candidates) {
            String key = null;
            if (c.memoryId() != null) {
                key = "conversation_memory:" + c.memoryId();
            } else if (c.embeddingId() != null) {
                key = c.sourceType() + ":" + c.embeddingId();
            }

            double gs = (key != null) ? graphScores.getOrDefault(key, 0.0) : 0.0;
            if (gs > 0) {
                double boost = (c.kind() == CandidateKind.MEMORY)
                        ? graphWeight * clamp(gs)       // memory: 0.10 * graph
                        : (graphWeight + 0.05) * clamp(gs); // embedding: 0.15 * graph
                boosted.add(c.withGraphBoost(clamp(gs), c.score() + boost));
            } else {
                boosted.add(c);
            }
        }

        return boosted;
    }

    private Set<String> tokenize(String query) {
        if (query == null || query.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(query.toLowerCase(Locale.ROOT).split("[^a-z0-9]+"))
                .filter(t -> t.length() > 2)
                .collect(Collectors.toCollection(HashSet::new));
    }

    private int estimateTokens(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        return Math.max(1, (int) Math.ceil(text.length() / 4.0));
    }

    private double avg(Float a, Float b) {
        float left = a == null ? 0.7f : a;
        float right = b == null ? 0.7f : b;
        return (left + right) / 2.0;
    }

    private double scoreOrDefault(Float value, double defaultValue) {
        return value == null ? defaultValue : value.doubleValue();
    }

    private double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }

    private enum CandidateKind {
        MEMORY,
        EMBEDDING
    }

    private record Candidate(
            CandidateKind kind,
            UUID memoryId,
            UUID embeddingId,
            String sourceType,
            String domain,
            String text,
            int tokenEstimate,
            double score,
            double vectorScore,
            double structuredScore,
            double recencyScore,
            double importanceScore,
            double confidenceScore,
            double graphScore
    ) {
        static Candidate fromMemory(ConversationMemory memory,
                                    double score,
                                    double vectorScore,
                                    double structuredScore,
                                    double recencyScore,
                                    double importanceScore,
                                    double confidenceScore) {
            String domain = memory.getDomain() != null ? memory.getDomain()
                    : (memory.getCategory() != null ? memory.getCategory() : "context");
            String text = memory.getMemoryText() == null ? "" : memory.getMemoryText();
            return new Candidate(
                    CandidateKind.MEMORY,
                    memory.getId(),
                    null,
                    "conversation_memory",
                    domain,
                    text,
                    Math.max(6, (int) Math.ceil(text.length() / 4.0)),
                    score,
                    vectorScore,
                    structuredScore,
                    recencyScore,
                    importanceScore,
                    confidenceScore,
                    0.0
            );
        }

        static Candidate fromEmbedding(EmbeddingService.EmbeddingCandidate embedding,
                                       double score,
                                       double vectorScore,
                                       double structuredScore,
                                       double recencyScore,
                                       double importanceScore,
                                       double confidenceScore) {
            String text = embedding.contentPreview() == null ? "" : embedding.contentPreview();
            String domain = embedding.domain() == null || embedding.domain().isBlank()
                    ? embedding.sourceType()
                    : embedding.domain();
            return new Candidate(
                    CandidateKind.EMBEDDING,
                    null,
                    embedding.embeddingId(),
                    embedding.sourceType(),
                    domain,
                    text,
                    Math.max(6, (int) Math.ceil(text.length() / 4.0)),
                    score,
                    vectorScore,
                    structuredScore,
                    recencyScore,
                    importanceScore,
                    confidenceScore,
                    0.0
            );
        }

        Candidate withGraphBoost(double graphScore, double newTotalScore) {
            return new Candidate(kind, memoryId, embeddingId, sourceType, domain, text,
                    tokenEstimate, newTotalScore, vectorScore, structuredScore, recencyScore,
                    importanceScore, confidenceScore, graphScore);
        }
    }

    public record RetrievalPlan(
            List<String> memoryLines,
            List<String> vectorLines,
            int usedTokens,
            int selectedCount,
            int tokenBudget,
            Set<QueryIntentClassifier.Intent> intents
    ) {
        static RetrievalPlan empty() {
            return new RetrievalPlan(List.of(), List.of(), 0, 0, 0, Set.of(QueryIntentClassifier.Intent.GENERAL));
        }

        public boolean isEmpty() {
            return memoryLines.isEmpty() && vectorLines.isEmpty();
        }
    }
}
