package com.lifos.backend.event;

import com.lifos.backend.service.EmbeddingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Asynchronously handles embedding creation/deletion after a transaction commits.
 * Running after commit ensures the source document is already persisted before
 * we attempt to read it back during embedding.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmbeddingEventListener {

    private final EmbeddingService embeddingService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onEmbeddingTrigger(EmbeddingTriggerEvent event) {
        try {
            if (event.text() == null) {
                embeddingService.deleteBySource(event.sourceType(), event.sourceId());
                log.debug("Deleted embedding for {} {}", event.sourceType(), event.sourceId());
            } else {
                embeddingService.embedAndStore(
                        event.userUid(), event.sourceType(), event.sourceId(), event.text());
            }
        } catch (Exception ex) {
            // Embedding failures are non-critical — log and continue
            log.warn("Async embedding failed for {} {}: {}", event.sourceType(), event.sourceId(), ex.getMessage());
        }
    }
}
