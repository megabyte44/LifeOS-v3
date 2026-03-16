package com.lifos.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifos.backend.config.AiFoundationProperties;
import com.lifos.backend.entity.AiConfiguration;
import com.lifos.backend.entity.ConversationMemory;
import com.lifos.backend.entity.MemoryRelationship;
import com.lifos.backend.entity.User;
import com.lifos.backend.repository.ConversationMemoryRepository;
import com.lifos.backend.repository.MemoryRelationshipRepository;
import com.lifos.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the graph-aware extraction path in {@link MemoryExtractionService}.
 *
 * Covers:
 * - "updates" relation: old memory marked isLatest=false, nextVersionId set, relationship saved
 * - "extends" relation: both memories stay isLatest=true, relationship saved
 * - memory_type="static" / "dynamic" preserved from API response
 * - expires_at parsed from ISO string and stored
 * - sessionId propagated to saved memory
 * - Hash deduplication: duplicate memory not saved
 * - Empty / malformed API response → no saves
 * - No API key → extraction skipped
 * - backward-compat overload (no sessionId) → sessionId=null stored
 */
@ExtendWith(MockitoExtension.class)
class MemoryExtractionGraphTest {

    @Mock ConversationMemoryRepository memoryRepository;
    @Mock MemoryRelationshipRepository relationshipRepository;
    @Mock UserRepository               userRepository;
    @Mock UserProfileService           userProfileService;
    @Mock EmbeddingService             embeddingService;
    @Mock AiConfigurationResolver      aiConfigurationResolver;
    @Mock RestTemplate                 restTemplate;

    // Constructed manually so we can inject real ObjectMapper + AiFoundationProperties
    MemoryExtractionService service;

    private static final String USER_UID   = "u-111";
    private static final UUID   SESSION_ID = UUID.randomUUID();

    private User             mockUser;
    private AiConfiguration  resolvedConfig;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        when(userRepository.findById(USER_UID)).thenReturn(Optional.of(mockUser));

        // resolve() returns an AiConfiguration entity with provider=openrouter
        resolvedConfig = AiConfiguration.builder()
                .modelConfig(Map.of("provider", "openrouter"))
                .apiKeys(Map.of())
                .build();
        when(aiConfigurationResolver.resolve()).thenReturn(resolvedConfig);
        when(aiConfigurationResolver.resolveProviderApiKey(anyString(), any())).thenReturn("sk-test");

        // No existing memories by default
        when(memoryRepository.findLatestActiveByUserUid(eq(USER_UID), any(Pageable.class)))
                .thenReturn(List.of());
        when(memoryRepository.findByUserUidAndMemoryHashAndActiveTrue(eq(USER_UID), anyString()))
                .thenReturn(Optional.empty());
        when(memoryRepository.save(any(ConversationMemory.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // RAG embeddings disabled so embedding service isn't called unexpectedly
        AiFoundationProperties props = new AiFoundationProperties();
        props.getRag().setEnableConversationMemoryEmbeddings(false);

        service = new MemoryExtractionService(
                memoryRepository, relationshipRepository, userRepository,
                userProfileService, embeddingService, props,
                aiConfigurationResolver, new ObjectMapper(), restTemplate);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /** Stubs RestTemplate to return a JSON array as the LLM extraction response. */
    private void mockApiResponse(String jsonArray) {
        // Escape the array so it lands as a string in the "content" field
        try {
            String escapedContent = new ObjectMapper().writeValueAsString(jsonArray);
            String responseBody = "{\"choices\":[{\"message\":{\"content\":" + escapedContent + "}}]}";
            ResponseEntity<String> resp = ResponseEntity.ok(responseBody);
            when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(String.class)))
                    .thenReturn(resp);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private ConversationMemory existingMemory(String text) {
        ConversationMemory m = new ConversationMemory();
        m.setId(UUID.randomUUID());
        m.setMemoryText(text);
        m.setMemoryType("static");
        m.setIsLatest(true);
        m.setForgotten(false);
        m.setActive(true);
        m.setUser(mockUser);
        m.setDomain("personal");
        m.setCategory("personal");
        return m;
    }

    // ── memory_type preservation ───────────────────────────────────────────

    @Test
    void staticMemoryType_persisted() {
        mockApiResponse("[{\"memory\":\"Punith is a developer\",\"category\":\"work\",\"confidence\":0.9,"
                + "\"memory_type\":\"static\",\"expires_at\":null,\"relation\":null}]");

        service.extractAndStore(USER_UID, "I am a developer", "Great!", SESSION_ID);

        ArgumentCaptor<ConversationMemory> captor = ArgumentCaptor.forClass(ConversationMemory.class);
        verify(memoryRepository, atLeastOnce()).save(captor.capture());
        ConversationMemory saved = firstNewMemory(captor);
        assertThat(saved.getMemoryType()).isEqualTo("static");
    }

    @Test
    void dynamicMemoryType_persisted() {
        mockApiResponse("[{\"memory\":\"Punith is debugging LifeOS\",\"category\":\"work\",\"confidence\":0.8,"
                + "\"memory_type\":\"dynamic\",\"expires_at\":null,\"relation\":null}]");

        service.extractAndStore(USER_UID, "debugging LifeOS now", "Got it!", SESSION_ID);

        ArgumentCaptor<ConversationMemory> captor = ArgumentCaptor.forClass(ConversationMemory.class);
        verify(memoryRepository, atLeastOnce()).save(captor.capture());
        assertThat(firstNewMemory(captor).getMemoryType()).isEqualTo("dynamic");
    }

    // ── Session ID ─────────────────────────────────────────────────────────

    @Test
    void sessionId_populatedOnSavedMemory() {
        mockApiResponse("[{\"memory\":\"I use Mac\",\"category\":\"preferences\",\"confidence\":0.85,"
                + "\"memory_type\":\"static\",\"expires_at\":null,\"relation\":null}]");

        service.extractAndStore(USER_UID, "I use Mac", "Noted!", SESSION_ID);

        ArgumentCaptor<ConversationMemory> captor = ArgumentCaptor.forClass(ConversationMemory.class);
        verify(memoryRepository, atLeastOnce()).save(captor.capture());
        assertThat(firstNewMemory(captor).getSessionId()).isEqualTo(SESSION_ID);
    }

    @Test
    void backwardCompatOverload_sessionIdIsNull() {
        mockApiResponse("[{\"memory\":\"I use Mac\",\"category\":\"preferences\",\"confidence\":0.85,"
                + "\"memory_type\":\"static\",\"expires_at\":null,\"relation\":null}]");

        service.extractAndStore(USER_UID, "I use Mac", "Noted!"); // no sessionId

        ArgumentCaptor<ConversationMemory> captor = ArgumentCaptor.forClass(ConversationMemory.class);
        verify(memoryRepository, atLeastOnce()).save(captor.capture());
        assertThat(firstNewMemory(captor).getSessionId()).isNull();
    }

    // ── expires_at ─────────────────────────────────────────────────────────

    @Test
    void expiresAt_parsedAndSet() {
        String iso = "2026-03-16T23:59:59Z";
        mockApiResponse("[{\"memory\":\"Flight to NYC tomorrow\",\"category\":\"context\","
                + "\"confidence\":0.9,\"memory_type\":\"dynamic\","
                + "\"expires_at\":\"" + iso + "\",\"relation\":null}]");

        service.extractAndStore(USER_UID, "flying to NYC tomorrow", "Safe travels!", SESSION_ID);

        ArgumentCaptor<ConversationMemory> captor = ArgumentCaptor.forClass(ConversationMemory.class);
        verify(memoryRepository, atLeastOnce()).save(captor.capture());
        assertThat(firstNewMemory(captor).getExpiresAt()).isEqualTo(Instant.parse(iso));
    }

    @Test
    void nullExpiresAt_storedAsNull() {
        mockApiResponse("[{\"memory\":\"I prefer vim\",\"category\":\"preferences\","
                + "\"confidence\":0.9,\"memory_type\":\"static\","
                + "\"expires_at\":null,\"relation\":null}]");

        service.extractAndStore(USER_UID, "I prefer vim", "Noted!", SESSION_ID);

        ArgumentCaptor<ConversationMemory> captor = ArgumentCaptor.forClass(ConversationMemory.class);
        verify(memoryRepository, atLeastOnce()).save(captor.capture());
        assertThat(firstNewMemory(captor).getExpiresAt()).isNull();
    }

    // ── "updates" relation ─────────────────────────────────────────────────

    @Test
    void updatesRelation_oldMemoryMarkedNotLatest() {
        ConversationMemory oldMem = existingMemory("Punith works at Google");
        when(memoryRepository.findLatestActiveByUserUid(eq(USER_UID), any(Pageable.class)))
                .thenReturn(List.of(oldMem));

        mockApiResponse("[{\"memory\":\"Punith now works at Stripe\",\"category\":\"work\","
                + "\"confidence\":0.95,\"memory_type\":\"static\","
                + "\"expires_at\":null,\"relation\":{\"type\":\"updates\",\"target_id\":\"mem_0\"}}]");

        service.extractAndStore(USER_UID, "I just joined Stripe", "Congrats!", SESSION_ID);

        verify(memoryRepository, atLeast(2)).save(any());
        assertThat(oldMem.getIsLatest()).isFalse();
        assertThat(oldMem.getActive()).isFalse();
    }

    @Test
    void updatesRelation_newMemoryLinkedToOld() {
        ConversationMemory oldMem = existingMemory("Punith works at Google");
        when(memoryRepository.findLatestActiveByUserUid(eq(USER_UID), any(Pageable.class)))
                .thenReturn(List.of(oldMem));

        mockApiResponse("[{\"memory\":\"Punith now works at Stripe\",\"category\":\"work\","
                + "\"confidence\":0.95,\"memory_type\":\"static\","
                + "\"expires_at\":null,\"relation\":{\"type\":\"updates\",\"target_id\":\"mem_0\"}}]");

        service.extractAndStore(USER_UID, "I just joined Stripe", "Congrats!", SESSION_ID);

        ArgumentCaptor<ConversationMemory> captor = ArgumentCaptor.forClass(ConversationMemory.class);
        verify(memoryRepository, atLeast(2)).save(captor.capture());
        ConversationMemory newMem = captor.getAllValues().stream()
                .filter(m -> m.getMemoryText() != null && m.getMemoryText().contains("Stripe"))
                .findFirst().orElseThrow();
        assertThat(newMem.getParentMemoryId()).isEqualTo(oldMem.getId());
    }

    @Test
    void updatesRelation_relationshipRecordSaved() {
        ConversationMemory oldMem = existingMemory("Punith works at Google");
        when(memoryRepository.findLatestActiveByUserUid(eq(USER_UID), any(Pageable.class)))
                .thenReturn(List.of(oldMem));

        mockApiResponse("[{\"memory\":\"Punith now works at Stripe\",\"category\":\"work\","
                + "\"confidence\":0.9,\"memory_type\":\"static\","
                + "\"expires_at\":null,\"relation\":{\"type\":\"updates\",\"target_id\":\"mem_0\"}}]");

        service.extractAndStore(USER_UID, "I just joined Stripe", "Congrats!", SESSION_ID);

        ArgumentCaptor<MemoryRelationship> relCaptor = ArgumentCaptor.forClass(MemoryRelationship.class);
        verify(relationshipRepository).save(relCaptor.capture());
        assertThat(relCaptor.getValue().getRelationshipType()).isEqualTo("updates");
    }

    // ── "extends" relation ────────────────────────────────────────────────

    @Test
    void extendsRelation_oldMemoryRemainsLatest() {
        ConversationMemory base = existingMemory("Punith works at Stripe");
        when(memoryRepository.findLatestActiveByUserUid(eq(USER_UID), any(Pageable.class)))
                .thenReturn(List.of(base));

        mockApiResponse("[{\"memory\":\"Punith leads a team of 5 at Stripe\","
                + "\"category\":\"work\",\"confidence\":0.85,\"memory_type\":\"static\","
                + "\"expires_at\":null,\"relation\":{\"type\":\"extends\",\"target_id\":\"mem_0\"}}]");

        service.extractAndStore(USER_UID, "I lead a team of 5", "Cool!", SESSION_ID);

        assertThat(base.getIsLatest()).isTrue();
        assertThat(base.getActive()).isTrue();
    }

    @Test
    void extendsRelation_relationshipSavedAsExtends() {
        ConversationMemory base = existingMemory("Punith works at Stripe");
        when(memoryRepository.findLatestActiveByUserUid(eq(USER_UID), any(Pageable.class)))
                .thenReturn(List.of(base));

        mockApiResponse("[{\"memory\":\"Punith leads payments team at Stripe\","
                + "\"category\":\"work\",\"confidence\":0.85,\"memory_type\":\"static\","
                + "\"expires_at\":null,\"relation\":{\"type\":\"extends\",\"target_id\":\"mem_0\"}}]");

        service.extractAndStore(USER_UID, "I lead payments at Stripe", "Nice!", SESSION_ID);

        ArgumentCaptor<MemoryRelationship> relCaptor = ArgumentCaptor.forClass(MemoryRelationship.class);
        verify(relationshipRepository).save(relCaptor.capture());
        assertThat(relCaptor.getValue().getRelationshipType()).isEqualTo("extends");
    }

    // ── Deduplication ──────────────────────────────────────────────────────

    @Test
    void duplicateHash_memoryNotSavedAgain() {
        when(memoryRepository.findByUserUidAndMemoryHashAndActiveTrue(eq(USER_UID), anyString()))
                .thenReturn(Optional.of(existingMemory("I prefer vim")));

        mockApiResponse("[{\"memory\":\"I prefer vim\",\"category\":\"preferences\","
                + "\"confidence\":0.9,\"memory_type\":\"static\","
                + "\"expires_at\":null,\"relation\":null}]");

        service.extractAndStore(USER_UID, "I prefer vim", "Got it!", SESSION_ID);

        verify(memoryRepository, never()).save(any());
    }

    // ── Empty / error API responses ────────────────────────────────────────

    @Test
    void emptyArrayResponse_noMemoriesSaved() {
        mockApiResponse("[]");
        service.extractAndStore(USER_UID, "sure", "ok", SESSION_ID);
        verify(memoryRepository, never()).save(any());
    }

    @Test
    void malformedJsonResponse_doesNotThrow_noMemoriesSaved() {
        mockApiResponse("not valid json ####");
        assertThatNoException()
                .isThrownBy(() -> service.extractAndStore(USER_UID, "test", "response", SESSION_ID));
        verify(memoryRepository, never()).save(any());
    }

    @Test
    void noApiKey_extractionSkipped() {
        when(aiConfigurationResolver.resolveProviderApiKey(anyString(), any())).thenReturn("");
        service.extractAndStore(USER_UID, "hello", "hi", SESSION_ID);
        verify(restTemplate, never()).exchange(anyString(), any(), any(), eq(String.class));
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /** Returns the first saved ConversationMemory that has actual text content (not an update to old). */
    private ConversationMemory firstNewMemory(ArgumentCaptor<ConversationMemory> captor) {
        return captor.getAllValues().stream()
                .filter(m -> m.getMemoryText() != null && !m.getMemoryText().isBlank())
                .findFirst()
                .orElseThrow(() -> new AssertionError("No new memory was saved"));
    }
}
