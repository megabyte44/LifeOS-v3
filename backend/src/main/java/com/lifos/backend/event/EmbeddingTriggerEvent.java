package com.lifos.backend.event;

import java.util.UUID;

/**
 * Spring application event that triggers async embedding of a source document.
 * Set {@code text} to {@code null} to delete an existing embedding instead.
 */
public record EmbeddingTriggerEvent(
        String userUid,
        String sourceType,   // e.g. "note" | "goal"
        UUID   sourceId,
        String text          // null = delete; non-null = embed/update
) {}
