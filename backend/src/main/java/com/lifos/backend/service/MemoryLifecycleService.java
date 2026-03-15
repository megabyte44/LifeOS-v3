package com.lifos.backend.service;

import com.lifos.backend.repository.ConversationMemoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Hourly background job that soft-expires temporal memories whose {@code expires_at}
 * timestamp has passed. Expired memories are flagged {@code forgotten = true} and
 * {@code is_latest = false} so they are excluded from context assembly and profile
 * generation without permanent deletion (audit trail preserved).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MemoryLifecycleService {

    private final ConversationMemoryRepository memoryRepository;

    /**
     * Runs every hour at the top of the hour.
     * Marks all memories where {@code expires_at < NOW()} as forgotten.
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void expireTemporalMemories() {
        int expired = memoryRepository.expireStaleMemories(Instant.now());
        if (expired > 0) {
            log.info("Memory lifecycle: expired {} temporal memory records", expired);
        }
    }
}
