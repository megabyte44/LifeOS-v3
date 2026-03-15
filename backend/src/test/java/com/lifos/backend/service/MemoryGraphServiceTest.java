package com.lifos.backend.service;

import com.lifos.backend.entity.ConversationMemory;
import com.lifos.backend.repository.ConversationMemoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link MemoryGraphService}.
 *
 * Covers:
 * - generateProfile() splits memories into static / dynamic buckets correctly
 * - generateProfile() returns empty profile gracefully when no memories exist
 * - computeStatus() returns "forgotten" for forgotten/superseded memories
 * - computeStatus() returns "expiring" for memories expiring within 24h
 * - computeStatus() returns "new" for memories created within last 24h
 * - computeStatus() returns "active" for normal live memories
 */
@ExtendWith(MockitoExtension.class)
class MemoryGraphServiceTest {

    @Mock ConversationMemoryRepository memoryRepository;

    @InjectMocks MemoryGraphService service;

    private static final String USER_UID = "user-abc";

    // ── generateProfile ────────────────────────────────────────────────────

    @Test
    void generateProfile_noMemories_returnsEmptyProfile() {
        when(memoryRepository.findStaticProfileMemories(USER_UID)).thenReturn(List.of());
        when(memoryRepository.findDynamicContextMemories(eq(USER_UID), any())).thenReturn(List.of());

        MemoryGraphService.ContextProfile profile = service.generateProfile(USER_UID);

        assertThat(profile.isEmpty()).isTrue();
        assertThat(profile.staticFacts()).isEmpty();
        assertThat(profile.dynamicFacts()).isEmpty();
    }

    @Test
    void generateProfile_staticMemoriesOnly_populatesStaticFacts() {
        ConversationMemory m = memory("Punith is a software engineer", "static");
        when(memoryRepository.findStaticProfileMemories(USER_UID)).thenReturn(List.of(m));
        when(memoryRepository.findDynamicContextMemories(eq(USER_UID), any())).thenReturn(List.of());

        MemoryGraphService.ContextProfile profile = service.generateProfile(USER_UID);

        assertThat(profile.staticFacts()).containsExactly("Punith is a software engineer");
        assertThat(profile.dynamicFacts()).isEmpty();
        assertThat(profile.isEmpty()).isFalse();
    }

    @Test
    void generateProfile_dynamicMemoriesOnly_populatesDynamicFacts() {
        ConversationMemory m = memory("Punith is debugging auth", "dynamic");
        when(memoryRepository.findStaticProfileMemories(USER_UID)).thenReturn(List.of());
        when(memoryRepository.findDynamicContextMemories(eq(USER_UID), any())).thenReturn(List.of(m));

        MemoryGraphService.ContextProfile profile = service.generateProfile(USER_UID);

        assertThat(profile.dynamicFacts()).containsExactly("Punith is debugging auth");
        assertThat(profile.staticFacts()).isEmpty();
    }

    @Test
    void generateProfile_bothTypes_populatesBothBuckets() {
        ConversationMemory staticMem  = memory("Punith prefers dark mode", "static");
        ConversationMemory dynamicMem = memory("Punith is working on LifeOS", "dynamic");
        when(memoryRepository.findStaticProfileMemories(USER_UID)).thenReturn(List.of(staticMem));
        when(memoryRepository.findDynamicContextMemories(eq(USER_UID), any())).thenReturn(List.of(dynamicMem));

        MemoryGraphService.ContextProfile profile = service.generateProfile(USER_UID);

        assertThat(profile.staticFacts()).hasSize(1);
        assertThat(profile.dynamicFacts()).hasSize(1);
    }

    // ── computeStatus ──────────────────────────────────────────────────────

    @Test
    void computeStatus_forgottenMemory_returnsForgotten() {
        ConversationMemory m = memory("temp", "dynamic");
        m.setForgotten(true);
        assertThat(service.computeStatus(m)).isEqualTo("forgotten");
    }

    @Test
    void computeStatus_notLatest_returnsForgotten() {
        ConversationMemory m = memory("temp", "dynamic");
        m.setIsLatest(false);
        assertThat(service.computeStatus(m)).isEqualTo("forgotten");
    }

    @Test
    void computeStatus_expiresWithin24h_returnsExpiring() {
        ConversationMemory m = memory("meeting soon", "dynamic");
        m.setExpiresAt(Instant.now().plusSeconds(3600)); // expires in 1h → within 24h window
        assertThat(service.computeStatus(m)).isEqualTo("expiring");
    }

    @Test
    void computeStatus_alreadyExpiredButNotForgotten_returnsExpiring() {
        // expires_at is in the past but lifecycle job hasn't run yet
        ConversationMemory m = memory("stale temporal", "dynamic");
        m.setExpiresAt(Instant.now().minusSeconds(60));
        assertThat(service.computeStatus(m)).isEqualTo("expiring");
    }

    @Test
    void computeStatus_createdLessThan24hAgo_returnsNew() {
        ConversationMemory m = memory("just added", "static");
        m.setCreatedAt(Instant.now().minusSeconds(3600)); // 1h ago
        assertThat(service.computeStatus(m)).isEqualTo("new");
    }

    @Test
    void computeStatus_normalLiveMemory_returnsActive() {
        ConversationMemory m = memory("old fact", "static");
        m.setCreatedAt(Instant.now().minusSeconds(86400 * 5)); // 5 days old
        assertThat(service.computeStatus(m)).isEqualTo("active");
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private ConversationMemory memory(String text, String type) {
        ConversationMemory m = new ConversationMemory();
        m.setMemoryText(text);
        m.setMemoryType(type);
        m.setIsLatest(true);
        m.setForgotten(false);
        m.setExpiresAt(null);
        m.setCreatedAt(Instant.now().minusSeconds(86400 * 3)); // 3 days old by default → active
        return m;
    }
}
