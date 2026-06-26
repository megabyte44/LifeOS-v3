package com.lifos.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lifos.backend.dto.NotificationDispatchRequest;
import com.lifos.backend.entity.AiConfiguration;
import com.lifos.backend.entity.User;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;

/**
 * Checkpoint 7 — Proactive Insights.
 *
 * Runs daily at the configured time (default 8 PM). For each user it builds
 * the full structured snapshot, asks the LLM to detect one meaningful pattern
 * (streak break, budget alert, deadline, milestone, etc.) and — if one is
 * found — dispatches a push notification via NotificationDispatchService.
 *
 * Respects the DB-level {@code insightsEnabled} flag. Can be triggered
 * manually via {@link #triggerForUser(String)} for admin testing.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InsightGeneratorService {

    private static final int MIN_SNAPSHOT_LENGTH = 80;

    private final AiConfigurationResolver aiConfigurationResolver;
    private final StructuredContextService structuredContextService;
    private final NotificationDispatchService notificationDispatchService;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // ── Scheduled entry point ──────────────────────────────────────────────────

    @Scheduled(cron = "${ai.insights.cron:0 0 20 * * *}")
    public void generateDailyInsights() {
        AiConfiguration config = aiConfigurationResolver.resolve();
        if (!Boolean.TRUE.equals(config.getInsightsEnabled())) {
            log.debug("Proactive insights disabled — skipping scheduled run");
            return;
        }

        List<User> users = userRepository.findAll();
        log.info("Generating proactive insights for {} user(s)", users.size());

        for (User user : users) {
            try {
                processForUser(user.getUid());
            } catch (Exception e) {
                log.warn("Insight generation failed for user [{}]: {}", user.getUid(), e.getMessage());
            }
        }
    }

    /**
     * Manual trigger exposed via the admin controller for testing
     * without waiting for the scheduled fire time.
     */
    public void triggerForUser(String userUid) {
        log.info("Manual insight trigger for user [{}]", userUid);
        processForUser(userUid);
    }

    // ── Core logic ────────────────────────────────────────────────────────────

    private void processForUser(String userUid) {
        String snapshot = structuredContextService.buildSnapshot(userUid);
        if (snapshot == null || snapshot.length() < MIN_SNAPSHOT_LENGTH) {
            log.debug("Snapshot too thin for user [{}] — skipping insight", userUid);
            return;
        }

        String apiKey = resolveApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("No API key available for insight generation — skipping");
            return;
        }

        String llmResponse = callLlm(buildPrompt(snapshot), apiKey);
        if (llmResponse == null || llmResponse.isBlank() || llmResponse.contains("SKIP")) {
            log.debug("No significant insight detected for user [{}]", userUid);
            return;
        }

        String title   = extractLine(llmResponse, "TITLE:");
        String message = extractLine(llmResponse, "MESSAGE:");
        if (title == null || message == null) {
            log.debug("Could not parse insight response for user [{}]: {}", userUid, llmResponse);
            return;
        }

        notificationDispatchService.dispatch(userUid, NotificationDispatchRequest.builder()
                .title(title)
                .message(message)
                .date(LocalDate.now().toString())
                .sourceType("ai_insight")
                .actionUrl("/ai-chat")
                .tag("ai-insight-" + LocalDate.now())
                .build());

        log.info("Proactive insight dispatched for user [{}]: {}", userUid, title);
    }

    // ── Prompt ────────────────────────────────────────────────────────────────

    private String buildPrompt(String snapshot) {
        return """
                You are the insight engine for LifeOS, a personal life-management app.

                Analyze today's data snapshot and detect ONE meaningful pattern worth highlighting.
                Check these patterns in priority order:
                1. Habit streak break — a habit shows streak: 0d or 1d after previously being active
                2. Streak milestone   — a habit streak is exactly 7, 14, 21, 30, 50, or 100 days
                3. Overdue todos      — high-priority todos have been pending for a long time
                4. Positive win       — notable achievement worth celebrating

                RULES:
                - If nothing meaningful stands out, respond with exactly: SKIP
                - Choose only the MOST significant pattern
                - Reference the specific name from the snapshot (habit name, todo text, etc.)
                - Message must be warm, motivational, and concise (2-3 sentences max)
                - Never be generic

                TODAY'S SNAPSHOT:
                """ + snapshot + """

                Respond with either:
                SKIP
                OR:
                TITLE: [max 40 chars]
                MESSAGE: [2-3 warm, motivational sentences]
                """;
    }

    // ── LLM call ──────────────────────────────────────────────────────────────

    private String callLlm(String prompt, String apiKey) {
        String provider = resolveProvider();
        String model    = resolveModel(provider);
        String url = provider.equals("openai")
                ? "https://api.openai.com/v1/chat/completions"
                : "https://openrouter.ai/api/v1/chat/completions";

        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            body.put("temperature", 0.65);
            body.put("max_tokens", 200);
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
                return objectMapper.readTree(resp.getBody())
                        .path("choices").get(0)
                        .path("message").path("content").asText("").strip();
            }
        } catch (Exception e) {
            log.warn("Insight LLM call failed: {}", e.getMessage());
        }
        return null;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String extractLine(String text, String prefix) {
        for (String line : text.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith(prefix)) {
                String value = trimmed.substring(prefix.length()).trim();
                return value.isBlank() ? null : value;
            }
        }
        return null;
    }

    private String resolveProvider() {
        var config = aiConfigurationResolver.resolve();
        String configured = (String) config.getModelConfig().getOrDefault("provider", "openrouter");
        // Gemini can be inconsistent with short structured outputs — prefer OpenAI-compatible
        return configured.equals("gemini") ? "openrouter" : configured;
    }

    private String resolveModel(String provider) {
        return provider.equals("openai") ? "gpt-4o-mini" : "openai/gpt-4o-mini";
    }

    private String resolveApiKey() {
        var config   = aiConfigurationResolver.resolve();
        String provider = resolveProvider();
        return aiConfigurationResolver.resolveProviderApiKey(provider, config.getApiKeys());
    }
}
