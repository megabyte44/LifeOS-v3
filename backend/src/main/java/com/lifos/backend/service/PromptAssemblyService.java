package com.lifos.backend.service;

import com.lifos.backend.dto.AiChatRequest;
import com.lifos.backend.entity.ConversationMemory;
import com.lifos.backend.entity.Embedding;
import com.lifos.backend.repository.ConversationMemoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    private final ConversationMemoryRepository conversationMemoryRepository;
    private final EmbeddingService embeddingService;

    /**
     * Builds the full context block that gets prepended to the system prompt.
     * This is injected as hidden context — the user never sees it directly.
     *
     * @param userQuery The user's current message, used for vector similarity search.
     */
    public String assembleContext(String userUid, String userQuery) {
        StringBuilder ctx = new StringBuilder();

        // 1. User profile
        String profileCtx = userProfileService.buildProfileContext(userUid);
        if (!profileCtx.isBlank()) {
            ctx.append("=== USER PROFILE ===\n").append(profileCtx).append("\n");
        }

        // 2. Structured life snapshot (SQL-based)
        String snapshot = structuredContextService.buildSnapshot(userUid);
        if (!snapshot.isBlank()) {
            ctx.append(snapshot);
        }

        // 3. Active conversation memories — grouped by category for clarity
        List<ConversationMemory> memories = conversationMemoryRepository
                .findByUserUidAndActiveTrueOrderByCreatedAtDesc(userUid, PageRequest.of(0, 50));
        if (!memories.isEmpty()) {
            ctx.append("=== WHAT I KNOW ABOUT YOU ===\n");
            // Preserve insertion order so category blocks are stable
            Map<String, List<ConversationMemory>> byCategory = memories.stream()
                    .collect(Collectors.groupingBy(
                            m -> m.getCategory() != null ? m.getCategory() : "context",
                            LinkedHashMap::new,
                            Collectors.toList()));
            for (Map.Entry<String, List<ConversationMemory>> entry : byCategory.entrySet()) {
                ctx.append("[").append(entry.getKey()).append("]");
                for (ConversationMemory m : entry.getValue()) {
                    ctx.append("  - ").append(m.getMemoryText()).append("\n");
                }
            }
            ctx.append("\n");
        }

        // 4. Vector search — semantically similar notes & goals for the current query
        if (userQuery != null && !userQuery.isBlank()) {
            try {
                List<Embedding> similar = embeddingService.searchSimilar(userUid, userQuery, 5);
                if (!similar.isEmpty()) {
                    ctx.append("=== RELEVANT NOTES & GOALS ===\n");
                    for (Embedding e : similar) {
                        ctx.append("- [").append(e.getSourceType()).append("] ")
                           .append(e.getContentPreview()).append("\n");
                    }
                    ctx.append("\n");
                }
            } catch (Exception ex) {
                log.warn("Vector search failed for user {}: {}", userUid, ex.getMessage());
            }
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
