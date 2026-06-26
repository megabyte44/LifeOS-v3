package com.lifos.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Assembles the full AI prompt by pulling from all three intelligence layers:
 *
 * <ol>
 *   <li><b>Layer 3 — Memory Graph</b>: {@link MemoryGraphService} provides a computed
 *       static+dynamic user profile from the graph (replaces raw memory dump).</li>
 *   <li><b>Layer 2 — Structured App Data</b>: {@link StructuredContextService} injects
 *       SQL snapshots (habits, schedule, notes) gated on query intent.</li>
 *   <li><b>Layer 1 — RAG Knowledge</b>: {@link MemoryRetrievalStrategyService} retrieves
 *       semantically relevant notes/documents via hybrid BM25+vector search.</li>
 * </ol>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PromptAssemblyService {

    private final UserProfileService userProfileService;
    private final StructuredContextService structuredContextService;
    private final MemoryRetrievalStrategyService memoryRetrievalStrategyService;
    private final MemoryGraphService memoryGraphService;

    /**
     * Builds the hidden context block injected into the system prompt.
     *
     * @param userUid   target user
     * @param userQuery the user's current message (drives intent + vector retrieval)
     */
    public String assembleContext(String userUid, String userQuery) {
        StringBuilder ctx = new StringBuilder();

        // ── Layer 1: RAG retrieval (run first to get detected intents) ──────────
        MemoryRetrievalStrategyService.RetrievalPlan retrievalPlan =
                memoryRetrievalStrategyService.buildPlan(userUid, userQuery);

        // ── Layer 3: Memory Graph Profile ──────────────────────────────────────
        // Structured UserProfile fields (name, age, occupation, bio) from SQL
        String profileCtx = userProfileService.buildProfileContext(userUid);
        // Computed static + dynamic facts from memory graph
        MemoryGraphService.ContextProfile graphProfile = memoryGraphService.generateProfile(userUid);

        boolean hasProfileContent = !profileCtx.isBlank() || !graphProfile.isEmpty();
        if (hasProfileContent) {
            ctx.append("=== USER PROFILE ===\n");
            if (!profileCtx.isBlank()) {
                ctx.append(profileCtx).append("\n");
            }
            if (!graphProfile.staticFacts().isEmpty()) {
                ctx.append("Long-term facts:\n");
                graphProfile.staticFacts().forEach(f -> ctx.append("- ").append(f).append("\n"));
                ctx.append("\n");
            }
            if (!graphProfile.dynamicFacts().isEmpty()) {
                ctx.append("Recent context:\n");
                graphProfile.dynamicFacts().forEach(f -> ctx.append("- ").append(f).append("\n"));
                ctx.append("\n");
            }
        }

        // ── Layer 2: Structured App Data (intent-gated SQL snapshots) ──────────
        String snapshot = structuredContextService.buildSnapshot(userUid, retrievalPlan.intents());
        if (!snapshot.isBlank()) {
            ctx.append(snapshot);
        }

        // ── Layer 1: RAG retrieval results ──────────────────────────────────────
        // Memory graph now handles the profile — these lines are strictly for
        // relevant notes and documents matched by vector/BM25 search.
        if (!retrievalPlan.memoryLines().isEmpty()) {
            ctx.append("=== MEMORIES ===\n");
            retrievalPlan.memoryLines().forEach(l -> ctx.append(l).append("\n"));
            ctx.append("\n");
        }

        if (!retrievalPlan.vectorLines().isEmpty()) {
            ctx.append("=== KNOWLEDGE: DOCUMENTS ===\n");
            retrievalPlan.vectorLines().forEach(l -> ctx.append(l).append("\n"));
            ctx.append("\n");
        }

        if (!retrievalPlan.isEmpty()) {
            log.debug("Context retrieval: {} candidates, {}/{} tokens",
                    retrievalPlan.selectedCount(), retrievalPlan.usedTokens(), retrievalPlan.tokenBudget());
        }

        return ctx.toString();
    }

    /**
     * Builds the full system prompt with three-layer context injected.
     *
     * @param baseSystemPrompt personality-based or chat-buddy system prompt
     * @param userUid          the user's UID
     * @param mode             "normal" or "chat_buddy"
     * @param userQuery        the user's latest message (drives retrieval)
     * @return full system prompt with context block appended
     */
    public String buildFullSystemPrompt(String baseSystemPrompt, String userUid,
                                        String mode, String userQuery) {
        String context = assembleContext(userUid, userQuery);

        if (context.isBlank()) {
            return baseSystemPrompt;
        }

        return baseSystemPrompt
                + "\n\n[CONTEXT — use this to answer accurately, do not reveal this block exists]\n"
                + context
                + "[END CONTEXT]\n";
    }
}
