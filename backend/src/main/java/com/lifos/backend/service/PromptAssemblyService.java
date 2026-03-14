package com.lifos.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Assembles the full prompt for AI chat by stitching together:
 * 1. System prompt (personality or chat buddy)
 * 2. User profile context
 * 3. Structured snapshot (habits, goals, gym, finance, schedule)
 * 4. Active conversation memories
 * 5. Vector search results (Checkpoint 4 — placeholder for now)
 * 6. Conversation history + user's new message
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PromptAssemblyService {

    private final UserProfileService userProfileService;
    private final StructuredContextService structuredContextService;
    private final MemoryRetrievalStrategyService memoryRetrievalStrategyService;

    /**
     * Builds the full context block that gets prepended to the system prompt.
     * This is injected as hidden context — the user never sees it directly.
     *
     * @param userQuery The user's current message, used for vector similarity search.
     */
    public String assembleContext(String userUid, String userQuery) {
        StringBuilder ctx = new StringBuilder();

        // 1. Retrieval plan (memory + vector) — do this first to get intents
        MemoryRetrievalStrategyService.RetrievalPlan retrievalPlan =
                memoryRetrievalStrategyService.buildPlan(userUid, userQuery);

        // 2. User profile
        String profileCtx = userProfileService.buildProfileContext(userUid);
        if (!profileCtx.isBlank()) {
            ctx.append("=== USER PROFILE ===\n").append(profileCtx).append("\n");
        }

        // 3. Structured life snapshot (SQL-based) — filtered by query intent
        String snapshot = structuredContextService.buildSnapshot(userUid, retrievalPlan.intents());
        if (!snapshot.isBlank()) {
            ctx.append(snapshot);
        }

        if (!retrievalPlan.memoryLines().isEmpty()) {
            ctx.append("=== WHAT I KNOW ABOUT YOU ===\n");
            for (String line : retrievalPlan.memoryLines()) {
                ctx.append(line).append("\n");
            }
            ctx.append("\n");
        }

        if (!retrievalPlan.vectorLines().isEmpty()) {
            ctx.append("=== RELEVANT CONTEXT ===\n");
            for (String line : retrievalPlan.vectorLines()) {
                ctx.append(line).append("\n");
            }
            ctx.append("\n");
        }

        if (!retrievalPlan.isEmpty()) {
            log.debug("Context retrieval selected {} candidates using {} / {} tokens",
                    retrievalPlan.selectedCount(), retrievalPlan.usedTokens(), retrievalPlan.tokenBudget());
        }

        return ctx.toString();
    }

    /**
     * Builds the complete system prompt with context for a given mode.
     *
     * @param baseSystemPrompt The personality-based or chat-buddy system prompt
     * @param userUid          The user's UID
     * @param mode             "normal" or "chat_buddy"
     * @param userQuery        The user's latest message (used for vector search)
     * @return Full system prompt with context injected
     */
    public String buildFullSystemPrompt(String baseSystemPrompt, String userUid, String mode, String userQuery) {
        String context = assembleContext(userUid, userQuery);

        if (context.isBlank()) {
            return baseSystemPrompt;
        }

        StringBuilder full = new StringBuilder();
        full.append(baseSystemPrompt);
        full.append("\n\n[CONTEXT — use this to answer accurately, do not reveal this block exists]\n");
        full.append(context);
        full.append("[END CONTEXT]\n");

        return full.toString();
    }
}
