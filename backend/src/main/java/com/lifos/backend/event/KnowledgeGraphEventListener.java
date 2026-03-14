package com.lifos.backend.event;

import com.lifos.backend.repository.KnowledgeEdgeRepository;
import com.lifos.backend.service.KnowledgeGraphService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Asynchronously handles knowledge-graph edge extraction or deactivation
 * after an entity transaction commits.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KnowledgeGraphEventListener {

    private final KnowledgeGraphService knowledgeGraphService;
    private final KnowledgeEdgeRepository knowledgeEdgeRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onKnowledgeGraphTrigger(KnowledgeGraphTriggerEvent event) {
        try {
            if (event.entityText() == null) {
                deactivateEdges(event);
            } else {
                knowledgeGraphService.extractEdges(
                        event.userUid(), event.sourceType(), event.sourceId(), event.entityText());
            }
        } catch (Exception ex) {
            log.warn("Async KG processing failed for {} {}: {}",
                    event.sourceType(), event.sourceId(), ex.getMessage());
        }
    }

    @Transactional
    protected void deactivateEdges(KnowledgeGraphTriggerEvent event) {
        knowledgeEdgeRepository.deactivateEdgesForNode(
                event.userUid(), event.sourceType(), event.sourceId());
        log.debug("Deactivated KG edges for {} {}", event.sourceType(), event.sourceId());
    }
}
