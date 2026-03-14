package com.lifos.backend.event;

import java.util.UUID;

/**
 * Spring application event that triggers async knowledge-graph edge extraction
 * (or edge deactivation) after an entity is saved or deleted.
 * Set {@code entityText} to {@code null} to deactivate all edges involving the node.
 */
public record KnowledgeGraphTriggerEvent(
        String userUid,
        String sourceType,
        UUID   sourceId,
        String entityText
) {}
