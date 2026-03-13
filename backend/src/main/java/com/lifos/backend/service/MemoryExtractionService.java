package com.lifos.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lifos.backend.dto.UpdateUserProfileRequest;
import com.lifos.backend.entity.ConversationMemory;
import com.lifos.backend.entity.User;
import com.lifos.backend.repository.ConversationMemoryRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Extracts persistent "life facts" from Chat Buddy conversations and stores
 * them in conversation_memories, grouped by semantic category.
 *
 * Runs fully async after a response is sent — chat latency is never affected.
 * Category-level replacement: when new memories arrive for a category, all
 * old memories in that category are deactivated first.
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
    private final UserRepository userRepository;
    private final UserProfileService userProfileService;
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

            // Group by category and do a category-level replace
            Map<String, List<MemoryChunk>> byCategory = extracted.stream()
                    .collect(Collectors.groupingBy(c -> c.category));

            for (Map.Entry<String, List<MemoryChunk>> entry : byCategory.entrySet()) {
                String category = entry.getKey();
                List<MemoryChunk> newChunks = entry.getValue();

                // Deactivate all old memories in this category before inserting new ones
                memoryRepository.deactivateByUserUidAndCategory(userUid, category);

                for (MemoryChunk chunk : newChunks) {
                    ConversationMemory memory = ConversationMemory.builder()
                            .user(user)
                            .memoryText(chunk.memory)
                            .category(category)
                            .confidence(chunk.confidence)
                            .sourceConversationDate(Instant.now())
                            .active(true)
                            .build();
                    memoryRepository.save(memory);
                }

                log.info("Stored {} memory chunk(s) under [{}] for user [{}]",
                        newChunks.size(), category, userUid);
            }

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
        String model = provider.equals("openai") ? "gpt-4o-mini" : "openai/gpt-4o-mini";
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

    private String resolveExtractionApiKey() {
        var config = aiConfigurationResolver.resolve();
        String provider = resolveExtractionProvider();
        return aiConfigurationResolver.resolveProviderApiKey(provider, config.getApiKeys());
    }

    // ── Internal DTO ─────────────────────────────────────────────────────────

    private record MemoryChunk(String memory, String category, float confidence) {}
}
