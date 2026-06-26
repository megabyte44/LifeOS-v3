package com.lifos.backend.service;

import com.lifos.backend.event.EmbeddingTriggerEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Unified ingestion facade: handles {@code chunking → embedding → event publishing}
 * in a single call so future feature adoption is a 1-liner.
 *
 * <h3>Usage</h3>
 * <pre>
 *   // Ingest a note (auto-chunks if long, publishes embedding event)
 *   ingestionPipeline.ingest(userUid, "note", noteId, noteContent);
 *
 *   // Delete embeddings for a deleted entity
 *   ingestionPipeline.delete(userUid, "note", noteId);
 * </pre>
 *
 * <h3>Chunking behaviour</h3>
 * <ul>
 *   <li>If {@code ai.chunking.enable-document-chunking=true} (default) and the text
 *       exceeds {@code chunkMaxChars}, {@link EmbeddingService#embedChunkedDocument}
 *       splits the text into overlapping chunks and stores each as a separate
 *       embedding row.</li>
 *   <li>Short texts fall through to the standard single-embedding path.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IngestionPipeline {

    private final EmbeddingService embeddingService;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Ingests a document: chunks it if needed, embeds and stores all chunks.
     * Runs synchronously — call from within an {@code @Async} method or use
     * {@link #ingestAsync} for fire-and-forget behaviour.
     *
     * @param userUid    target user
     * @param sourceType entity type (e.g. "note", "journal", "document")
     * @param sourceId   entity primary key
     * @param text       full document text
     */
    public void ingest(String userUid, String sourceType, UUID sourceId, String text) {
        if (text == null || text.isBlank()) {
            return;
        }
        embeddingService.embedChunkedDocument(userUid, sourceType, sourceId, text);
    }

    /**
     * Fire-and-forget version of {@link #ingest} — returns immediately.
     */
    @Async
    public void ingestAsync(String userUid, String sourceType, UUID sourceId, String text) {
        ingest(userUid, sourceType, sourceId, text);
    }

    /**
     * Publishes an {@link EmbeddingTriggerEvent} for source types that are
     * handled by the existing event-listener pipeline (notes, goals, etc.).
     * Prefer {@link #ingest} for new features.
     */
    public void publishEvent(String userUid, String sourceType, UUID sourceId, String text) {
        eventPublisher.publishEvent(EmbeddingTextBuilder.buildEvent(userUid, sourceType, sourceId, text));
    }

    /**
     * Deletes all embeddings (including chunks) for the given source entity.
     */
    public void delete(String userUid, String sourceType, UUID sourceId) {
        embeddingService.deleteBySource(sourceType, sourceId);
        log.debug("Deleted embeddings for {} {}", sourceType, sourceId);
    }

    /**
     * Publishes a delete event via the existing event-listener pipeline.
     */
    public void publishDeleteEvent(String userUid, String sourceType, UUID sourceId) {
        eventPublisher.publishEvent(EmbeddingTextBuilder.deleteEvent(userUid, sourceType, sourceId));
    }
}
