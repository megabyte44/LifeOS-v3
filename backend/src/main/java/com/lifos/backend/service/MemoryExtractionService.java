package com.lifos.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lifos.backend.dto.UpdateUserProfileRequest;
import com.lifos.backend.config.AiFoundationProperties;
import com.lifos.backend.entity.ConversationMemory;
import com.lifos.backend.entity.MemoryRelationship;
import com.lifos.backend.entity.User;
import com.lifos.backend.repository.ConversationMemoryRepository;
import com.lifos.backend.repository.MemoryRelationshipRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.HexFormat;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Extracts persistent "life facts" from Chat Buddy conversations and stores
 * them in conversation_memories as versioned, fact-level records.
 *
 * Runs fully async after a response is sent — chat latency is never affected.
 * Facts are deduplicated by hash and can supersede older facts without
 * deactivating an entire category.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MemoryExtractionService {

    private static final Set<String> VALID_CATEGORIES = Set.of(
            "personal", "goals", "health", "work", "relationships", "preferences", "context"
    );

    private static final Pattern AGE_PATTERN = Pattern.compile(
            "\\b(?:I(?:'m| am)|age[: ]*)(\\d{1,2})\\b|\\b(\\d{1,2})\\s*(?:years? old|yo)\\b",
            Pattern.CASE_INSENSITIVE);

    private final ConversationMemoryRepository memoryRepository;
    private final MemoryRelationshipRepository memoryRelationshipRepository;
    private final UserRepository userRepository;
    private final UserProfileService userProfileService;
    private final EmbeddingService embeddingService;
    private final AiFoundationProperties aiFoundationProperties;
    private final AiConfigurationResolver aiConfigurationResolver;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    /**
     * Extracts and stores memories from a completed Chat Buddy exchange.
     * Fires async — never blocks the HTTP response.
     *
     * @param userUid     The user whose memory we're updating
     * @param userMessage The user's last message in the exchange
     * @param aiResponse  The AI's complete response
     */
    @Async
    @Transactional
    public void extractAndStore(String userUid, String userMessage, String aiResponse) {
        try {
            String apiKey = resolveExtractionApiKey();
            if (apiKey == null || apiKey.isBlank()) {
                log.debug("No API key available for memory extraction, skipping.");
                return;
            }

            List<ConversationMemory> existingMemories =
                    memoryRepository.findByUserUidAndActiveTrueOrderByCreatedAtAsc(userUid);

            String extractionPrompt = buildExtractionPrompt(userMessage, aiResponse, existingMemories);
            List<MemoryChunk> extracted = callExtractionApi(apiKey, extractionPrompt);

            if (extracted.isEmpty()) {
                log.debug("No new memories extracted for user [{}]", userUid);
                return;
            }

            User user = userRepository.findById(userUid).orElse(null);
            if (user == null) {
                log.warn("User [{}] not found during memory extraction, skipping.", userUid);
                return;
            }

            Map<String, List<MemoryChunk>> byCategory = extracted.stream()
                    .collect(Collectors.groupingBy(c -> c.category));

            int storedCount = 0;
            int dedupedCount = 0;

            for (MemoryChunk chunk : extracted) {
                String normalized = normalizeMemoryText(chunk.memory);
                if (normalized.isBlank()) {
                    continue;
                }

                String hash = computeHash(normalized);
                if (memoryRepository.findByUserUidAndMemoryHashAndActiveTrue(userUid, hash).isPresent()) {
                    dedupedCount++;
                    continue;
                }

                String domain = normalizeDomain(chunk.category);
                ConversationMemory superseded = findLikelySuperseded(existingMemories, domain, normalized);

                ConversationMemory memory = ConversationMemory.builder()
                        .user(user)
                        .memoryText(chunk.memory)
                        .category(chunk.category)
                        .domain(domain)
                        .confidence(chunk.confidence)
                        .factualityScore(clamp(chunk.confidence))
                        .relevanceScore(0.7f)
                        .timelinessScore(0.7f)
                        .overallConfidence(weightedOverall(chunk.confidence))
                        .memoryHash(hash)
                        .verificationStatus("unverified")
                        .extractionModel(resolveExtractionModelName())
                        .extractionConfidence(clamp(chunk.confidence))
                        .sourceConversationDate(Instant.now())
                        .active(true)
                        .updatedAt(Instant.now())
                        .build();

                if (superseded != null) {
                    memory.setParentMemoryId(superseded.getId());
                }

                ConversationMemory saved = memoryRepository.save(memory);
                existingMemories.add(saved);
                storedCount++;

                if (superseded != null) {
                    superseded.setActive(false);
                    superseded.setSupersededBy(saved.getId());
                    superseded.setArchivedAt(Instant.now());
                    superseded.setUpdatedAt(Instant.now());
                    memoryRepository.save(superseded);

                    memoryRelationshipRepository.save(MemoryRelationship.builder()
                            .user(user)
                            .fromMemory(superseded)
                            .toMemory(saved)
                            .relationshipType("supersedes")
                            .confidence(Math.max(0.65f, chunk.confidence))
                            .reason("Detected semantic update for same domain fact")
                            .build());
                }

                if (aiFoundationProperties.getRag().isEnableConversationMemoryEmbeddings()) {
                    embeddingService.embedAndStore(
                        userUid,
                        "conversation_memory",
                        saved.getId(),
                        saved.getMemoryText(),
                        domain,
                        "conversation_memory",
                        clamp(saved.getOverallConfidence()),
                        0.8f,
                        0.7f
                    );
                }
            }

            log.info("Memory extraction for user [{}]: stored={}, deduped={}", userUid, storedCount, dedupedCount);

            // Enrich structured profile fields from extracted memory chunks
            enrichProfileFromChunks(userUid, byCategory);

        } catch (Exception ex) {
            // Memory extraction is non-critical — log and swallow
            log.warn("Memory extraction failed for user [{}]: {}", userUid, ex.getMessage());
        }
    }

    // ── Profile enrichment from memory chunks ─────────────────────────────────

    /**
     * After memories are saved, automatically sync structured profile fields:
     * - [personal] → look for age mentions via regex
     * - [work]     → use first chunk text as occupation
     * This is rule-based and cheap — no extra API call needed.
     */
    private void enrichProfileFromChunks(String userUid, Map<String, List<MemoryChunk>> byCategory) {
        try {
            UpdateUserProfileRequest update = new UpdateUserProfileRequest();
            boolean hasUpdate = false;

            // Extract age from 'personal' category memories
            List<MemoryChunk> personalChunks = byCategory.getOrDefault("personal", List.of());
            for (MemoryChunk chunk : personalChunks) {
                Matcher m = AGE_PATTERN.matcher(chunk.memory());
                if (m.find()) {
                    String ageStr = m.group(1) != null ? m.group(1) : m.group(2);
                    try {
                        int age = Integer.parseInt(ageStr);
                        if (age >= 10 && age <= 120) {
                            update.setAge(age);
                            hasUpdate = true;
                        }
                    } catch (NumberFormatException ignored) {}
                    break;
                }
            }

            // Use first work memory as occupation if it looks like a role/title
            List<MemoryChunk> workChunks = byCategory.getOrDefault("work", List.of());
            if (!workChunks.isEmpty()) {
                String occupation = workChunks.get(0).memory();
                if (occupation.length() <= 120) { // Sanity-check length
                    update.setOccupation(occupation);
                    hasUpdate = true;
                }
            }

            if (hasUpdate) {
                userProfileService.updateProfile(userUid, update);
                log.debug("Auto-enriched profile for user [{}] from memories", userUid);
            }
        } catch (Exception ex) {
            log.warn("Profile enrichment from memories failed for user [{}]: {}", userUid, ex.getMessage());
        }
    }

    // ── Extraction prompt ─────────────────────────────────────────────────────

    private String buildExtractionPrompt(String userMessage, String aiResponse,
                                         List<ConversationMemory> existing) {
        StringBuilder sb = new StringBuilder();

        sb.append("""
                You are a memory extraction engine for a personal life-management assistant.
                Your ONLY job is to extract factual statements the USER made about themselves.

                RULES:
                - Extract facts from what the USER said, NOT from the AI response.
                - Only extract things that are useful long-term (not "ok", "sure", "thanks").
                - Be concise — each memory should be a single, clear, atomic fact.
                - If nothing noteworthy was said, return an empty array [].
                - Categories: personal | goals | health | work | relationships | preferences | context

                OUTPUT FORMAT (strict JSON array, no markdown, no explanation):
                [{"memory":"...", "category":"...", "confidence":0.9}]

                """);

        if (!existing.isEmpty()) {
            sb.append("WHAT IS ALREADY KNOWN (do not repeat these unless they have changed):\n");
            Map<String, List<ConversationMemory>> grouped = existing.stream()
                    .collect(Collectors.groupingBy(m ->
                            m.getCategory() != null ? m.getCategory() : "context"));
            for (Map.Entry<String, List<ConversationMemory>> entry : grouped.entrySet()) {
                sb.append("[").append(entry.getKey()).append("] ");
                sb.append(entry.getValue().stream()
                        .map(ConversationMemory::getMemoryText)
                        .collect(Collectors.joining(" | ")));
                sb.append("\n");
            }
            sb.append("\n");
        }

        sb.append("CONVERSATION EXCHANGE:\n");
        sb.append("User: ").append(userMessage).append("\n");
        sb.append("Assistant: ").append(aiResponse).append("\n");

        return sb.toString();
    }

    // ── API call ──────────────────────────────────────────────────────────────

    private List<MemoryChunk> callExtractionApi(String apiKey, String prompt) {
        // Use the cheapest/fastest model always — extraction doesn't need power
        String provider = resolveExtractionProvider();
        String model = resolveExtractionModelName();
        String url = provider.equals("openai")
                ? "https://api.openai.com/v1/chat/completions"
                : "https://openrouter.ai/api/v1/chat/completions";

        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            body.put("temperature", 0.2);
            body.put("max_tokens", 512);

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
                return parseMemoryChunks(content);
            }
        } catch (Exception e) {
            log.warn("Extraction API call failed: {}", e.getMessage());
        }
        return List.of();
    }

    private List<MemoryChunk> parseMemoryChunks(String raw) {
        // Strip markdown code fences if present
        String cleaned = raw.strip();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("```[a-z]*\\s*", "").replaceAll("```$", "").strip();
        }

        List<MemoryChunk> result = new ArrayList<>();
        try {
            JsonNode arr = objectMapper.readTree(cleaned);
            if (!arr.isArray()) return result;

            for (JsonNode node : arr) {
                String memory   = node.path("memory").asText("").strip();
                String category = node.path("category").asText("context").strip().toLowerCase();
                float  conf     = (float) node.path("confidence").asDouble(0.7);

                if (memory.isBlank()) continue;
                if (!VALID_CATEGORIES.contains(category)) category = "context";

                result.add(new MemoryChunk(memory, category, conf));
            }
        } catch (Exception e) {
            log.warn("Failed to parse memory extraction JSON: {} | raw='{}'", e.getMessage(), raw);
        }
        return result;
    }

    // ── Provider resolution ───────────────────────────────────────────────────

    private String resolveExtractionProvider() {
        var config = aiConfigurationResolver.resolve();
        String configured = (String) config.getModelConfig().getOrDefault("provider", "openrouter");
        // Gemini doesn't support JSON mode well — fall back to openrouter
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

    private String normalizeMemoryText(String text) {
        if (text == null) {
            return "";
        }
        return text.replaceAll("\\s+", " ").trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeDomain(String category) {
        if (category == null || category.isBlank()) {
            return "context";
        }
        String normalized = category.trim().toLowerCase(Locale.ROOT);
        return VALID_CATEGORIES.contains(normalized) ? normalized : "context";
    }

    private String computeHash(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    private ConversationMemory findLikelySuperseded(List<ConversationMemory> existing,
                                                    String domain,
                                                    String newText) {
        for (ConversationMemory candidate : existing) {
            if (!Boolean.TRUE.equals(candidate.getActive())) {
                continue;
            }
            String candidateDomain = normalizeDomain(candidate.getDomain() != null
                    ? candidate.getDomain()
                    : candidate.getCategory());
            if (!candidateDomain.equals(domain)) {
                continue;
            }

            String oldText = normalizeMemoryText(candidate.getMemoryText());
            if (oldText.isBlank()) {
                continue;
            }

            if (newText.contains(oldText) || oldText.contains(newText) || tokenOverlap(newText, oldText) >= 0.8f) {
                return candidate;
            }
        }
        return null;
    }

    private float tokenOverlap(String a, String b) {
        Set<String> left = Arrays.stream(a.split(" "))
                .filter(s -> s.length() > 2)
                .collect(Collectors.toSet());
        Set<String> right = Arrays.stream(b.split(" "))
                .filter(s -> s.length() > 2)
                .collect(Collectors.toSet());

        if (left.isEmpty() || right.isEmpty()) {
            return 0f;
        }

        Set<String> intersection = new HashSet<>(left);
        intersection.retainAll(right);
        int minSize = Math.min(left.size(), right.size());
        return minSize == 0 ? 0f : (float) intersection.size() / minSize;
    }

    private float weightedOverall(float extractionConfidence) {
        float c = clamp(extractionConfidence);
        return clamp((0.45f * c) + (0.30f * 0.7f) + (0.25f * 0.7f));
    }

    private float clamp(float score) {
        return Math.max(0f, Math.min(1f, score));
    }

    // ── Internal DTO ─────────────────────────────────────────────────────────

    private record MemoryChunk(String memory, String category, float confidence) {}
}
