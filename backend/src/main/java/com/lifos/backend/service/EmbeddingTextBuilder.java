package com.lifos.backend.service;

import com.lifos.backend.event.EmbeddingTriggerEvent;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Centralized registry that maps each source type to its embed text format
 * and metadata tuple (domain, domainTag, quality, recency, importance).
 */
@Component
public class EmbeddingTextBuilder {

    public record EmbeddingMeta(String domain, String domainTag, float quality, float recency, float importance) {}

    // ── Metadata registry ────────────────────────────────────────────────

    public static EmbeddingMeta metaFor(String sourceType) {
        return switch (sourceType) {
            case "note"                -> new EmbeddingMeta("knowledge",    "note",                0.85f, 0.5f, 0.7f);
            case "goal"                -> new EmbeddingMeta("goals",        "goal",                0.90f, 0.6f, 0.9f);
            case "conversation_memory" -> new EmbeddingMeta(null,           "conversation_memory", 0.70f, 0.8f, 0.7f);
            case "todo"                -> new EmbeddingMeta("productivity", "todo",                0.65f, 0.9f, 0.6f);
            case "habit"               -> new EmbeddingMeta("health",       "habit",               0.75f, 0.3f, 0.7f);
            case "transaction"         -> new EmbeddingMeta("finance",      "transaction",         0.60f, 0.9f, 0.4f);
            case "planner_item"        -> new EmbeddingMeta("schedule",     "planner_item",        0.60f, 0.95f, 0.5f);
            case "user_profile"        -> new EmbeddingMeta("personal",     "user_profile",        0.95f, 0.1f, 1.0f);
            case "goal_note"           -> new EmbeddingMeta("goals",        "goal_note",           0.80f, 0.5f, 0.7f);
            case "goal_resource"       -> new EmbeddingMeta("goals",        "goal_resource",       0.70f, 0.3f, 0.5f);
            case "sub_goal"            -> new EmbeddingMeta("goals",        "sub_goal",            0.75f, 0.5f, 0.8f);
            case "workout_split"       -> new EmbeddingMeta("health",       "workout_split",       0.70f, 0.2f, 0.6f);
            // Phase 5 additions — future feature source types
            case "journal"             -> new EmbeddingMeta("personal",     "journal",             0.80f, 0.7f, 0.75f);
            case "saved_link"          -> new EmbeddingMeta("knowledge",    "saved_link",          0.70f, 0.4f, 0.6f);
            case "document"            -> new EmbeddingMeta("knowledge",    "document",            0.85f, 0.3f, 0.7f);
            default                    -> new EmbeddingMeta(null,           sourceType,            0.70f, 0.5f, 0.5f);
        };
    }

    // ── Factory methods for full events ──────────────────────────────────

    public static EmbeddingTriggerEvent buildEvent(String userUid, String sourceType, UUID sourceId, String text) {
        EmbeddingMeta meta = metaFor(sourceType);
        return new EmbeddingTriggerEvent(
                userUid, sourceType, sourceId, text,
                meta.domain(), meta.domainTag(), meta.quality(), meta.recency(), meta.importance()
        );
    }

    public static EmbeddingTriggerEvent deleteEvent(String userUid, String sourceType, UUID sourceId) {
        return EmbeddingTriggerEvent.delete(userUid, sourceType, sourceId);
    }
}
