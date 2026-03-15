package com.lifos.backend.service;

import com.lifos.backend.entity.ConversationMemory;
import com.lifos.backend.repository.ConversationMemoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Provides a computed "Profile" view over the memory graph for a user.
 *
 * <p>Follows the Supermemory pattern: instead of a separate structured profile table,
 * the profile is generated on-the-fly from {@code isLatest = true} memory nodes
 * grouped by {@code memoryType} (static / dynamic).
 *
 * <p>The resulting {@link ContextProfile} is injected into the system prompt by
 * {@link PromptAssemblyService} as the {@code === USER PROFILE ===} block.
 */
@Service
@RequiredArgsConstructor
public class MemoryGraphService {

    private static final int MAX_DYNAMIC = 12;

    private final ConversationMemoryRepository memoryRepository;

    /**
     * Generates a two-part profile from the memory graph.
     *
     * @param userUid target user
     * @return profile containing separate static and dynamic fact lists
     */
    public ContextProfile generateProfile(String userUid) {
        List<ConversationMemory> staticMemories =
                memoryRepository.findStaticProfileMemories(userUid);

        List<ConversationMemory> dynamicMemories =
                memoryRepository.findDynamicContextMemories(
                        userUid, PageRequest.of(0, MAX_DYNAMIC));

        List<String> staticFacts = staticMemories.stream()
                .map(ConversationMemory::getMemoryText)
                .collect(Collectors.toList());

        List<String> dynamicFacts = dynamicMemories.stream()
                .map(ConversationMemory::getMemoryText)
                .collect(Collectors.toList());

        return new ContextProfile(staticFacts, dynamicFacts);
    }

    /**
     * Computes a memory's display status for graph visualization (Phase 6).
     *
     * <ul>
     *   <li>{@code "forgotten"} — expired or superseded</li>
     *   <li>{@code "expiring"} — expires within the next 24 hours</li>
     *   <li>{@code "new"} — created within the last 24 hours</li>
     *   <li>{@code "active"} — normal live memory</li>
     * </ul>
     */
    public String computeStatus(ConversationMemory mem) {
        if (Boolean.TRUE.equals(mem.getForgotten()) || !Boolean.TRUE.equals(mem.getIsLatest())) {
            return "forgotten";
        }
        Instant now = Instant.now();
        if (mem.getExpiresAt() != null && mem.getExpiresAt().isBefore(now.plusSeconds(86400))) {
            return "expiring";
        }
        if (mem.getCreatedAt() != null && mem.getCreatedAt().isAfter(now.minusSeconds(86400))) {
            return "new";
        }
        return "active";
    }

    /**
     * Immutable profile snapshot returned by {@link #generateProfile}.
     */
    public record ContextProfile(
            /** Long-term facts that rarely change (name, job, preferences). */
            List<String> staticFacts,
            /** Recent/evolving context (current projects, activities). */
            List<String> dynamicFacts
    ) {
        public boolean isEmpty() {
            return staticFacts.isEmpty() && dynamicFacts.isEmpty();
        }
    }
}
