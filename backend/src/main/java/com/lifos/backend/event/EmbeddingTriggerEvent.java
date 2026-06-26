package com.lifos.backend.event;

import java.util.UUID;

/**
 * Spring application event that triggers async embedding of a source document.
 * Set {@code text} to {@code null} to delete an existing embedding instead.
 */
public record EmbeddingTriggerEvent(
        String userUid,
        String sourceType,   // e.g. "note" | "goal" | "todo" | "habit" | ...
        UUID   sourceId,
        String text,          // null = delete; non-null = embed/update
        String domain,        // nullable, e.g. "finance", "health", "productivity"
        String domainTag,     // nullable, e.g. "todo", "habit" (for filtering)
        float  qualityScore,  // 0-1, embedding quality signal
        float  recencyWeight, // 0-1, how much recency matters for this source
        float  importanceSignal // 0-1, importance signal for this source
) {

    /** Backward-compatible factory for existing callers (notes, goals). */
    public static EmbeddingTriggerEvent simple(String userUid, String sourceType, UUID sourceId, String text) {
        return new EmbeddingTriggerEvent(userUid, sourceType, sourceId, text, null, null, 0.7f, 0.5f, 0.5f);
    }

    /** Factory for deletion events. */
    public static EmbeddingTriggerEvent delete(String userUid, String sourceType, UUID sourceId) {
        return new EmbeddingTriggerEvent(userUid, sourceType, sourceId, null, null, null, 0f, 0f, 0f);
    }
}
