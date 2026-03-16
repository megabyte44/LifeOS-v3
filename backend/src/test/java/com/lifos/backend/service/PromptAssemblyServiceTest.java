package com.lifos.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link PromptAssemblyService}'s three-layer context assembly.
 *
 * Covers:
 * - Static profile facts appear in the USER PROFILE block
 * - Dynamic facts appear in the USER PROFILE block
 * - Structured SQL snapshot is injected
 * - Vector/RAG lines appear in KNOWLEDGE: DOCUMENTS block
 * - Memory lines appear in MEMORIES block
 * - Empty context → base prompt returned unchanged
 * - buildFullSystemPrompt wraps context in [CONTEXT] markers
 * - Layer sections are correctly separated (no bleed-through)
 */
@ExtendWith(MockitoExtension.class)
class PromptAssemblyServiceTest {

    @Mock UserProfileService                 userProfileService;
    @Mock StructuredContextService           structuredContextService;
    @Mock MemoryRetrievalStrategyService     memoryRetrievalStrategyService;
    @Mock MemoryGraphService                 memoryGraphService;

    @InjectMocks PromptAssemblyService service;

    private static final String USER_UID = "user-test";
    private static final String QUERY    = "what are my goals?";

    // ── Helpers ────────────────────────────────────────────────────────────

    /** Returns an empty retrieval plan (no memories, no vector results). */
    private MemoryRetrievalStrategyService.RetrievalPlan emptyPlan() {
        return new MemoryRetrievalStrategyService.RetrievalPlan(
                List.of(), List.of(), 0, 0, 1400,
                Set.of(QueryIntentClassifier.Intent.GENERAL));
    }

    private MemoryRetrievalStrategyService.RetrievalPlan planWith(
            List<String> memoryLines, List<String> vectorLines) {
        return new MemoryRetrievalStrategyService.RetrievalPlan(
                memoryLines, vectorLines,
                memoryLines.size() * 50 + vectorLines.size() * 50,
                memoryLines.size() + vectorLines.size(), 1400,
                Set.of(QueryIntentClassifier.Intent.GENERAL));
    }

    // ── Empty context ──────────────────────────────────────────────────────

    @Test
    void allLayersEmpty_returnsEmptyContext() {
        when(memoryRetrievalStrategyService.buildPlan(USER_UID, QUERY)).thenReturn(emptyPlan());
        when(userProfileService.buildProfileContext(USER_UID)).thenReturn("");
        when(memoryGraphService.generateProfile(USER_UID))
                .thenReturn(new MemoryGraphService.ContextProfile(List.of(), List.of()));
        when(structuredContextService.buildSnapshot(eq(USER_UID), any())).thenReturn("");

        assertThat(service.assembleContext(USER_UID, QUERY)).isBlank();
    }

    @Test
    void emptyContext_buildFullSystemPrompt_returnsBasePromptUnchanged() {
        when(memoryRetrievalStrategyService.buildPlan(USER_UID, QUERY)).thenReturn(emptyPlan());
        when(userProfileService.buildProfileContext(USER_UID)).thenReturn("");
        when(memoryGraphService.generateProfile(USER_UID))
                .thenReturn(new MemoryGraphService.ContextProfile(List.of(), List.of()));
        when(structuredContextService.buildSnapshot(eq(USER_UID), any())).thenReturn("");

        String result = service.buildFullSystemPrompt("Be helpful.", USER_UID, "chat_buddy", QUERY);
        assertThat(result).isEqualTo("Be helpful.");
    }

    // ── Layer 3: Memory Graph Profile ─────────────────────────────────────

    @Test
    void staticFacts_appearInProfileBlock() {
        when(memoryRetrievalStrategyService.buildPlan(USER_UID, QUERY)).thenReturn(emptyPlan());
        when(userProfileService.buildProfileContext(USER_UID)).thenReturn("");
        when(memoryGraphService.generateProfile(USER_UID))
                .thenReturn(new MemoryGraphService.ContextProfile(
                        List.of("Punith is a software engineer"), List.of()));
        when(structuredContextService.buildSnapshot(eq(USER_UID), any())).thenReturn("");

        String context = service.assembleContext(USER_UID, QUERY);

        assertThat(context).contains("USER PROFILE");
        assertThat(context).contains("Long-term facts");
        assertThat(context).contains("Punith is a software engineer");
    }

    @Test
    void dynamicFacts_appearInRecentContextBlock() {
        when(memoryRetrievalStrategyService.buildPlan(USER_UID, QUERY)).thenReturn(emptyPlan());
        when(userProfileService.buildProfileContext(USER_UID)).thenReturn("");
        when(memoryGraphService.generateProfile(USER_UID))
                .thenReturn(new MemoryGraphService.ContextProfile(
                        List.of(), List.of("Punith is debugging LifeOS auth")));
        when(structuredContextService.buildSnapshot(eq(USER_UID), any())).thenReturn("");

        String context = service.assembleContext(USER_UID, QUERY);

        assertThat(context).contains("Recent context");
        assertThat(context).contains("Punith is debugging LifeOS auth");
    }

    @Test
    void structuredProfileFields_appearInProfileBlock() {
        when(memoryRetrievalStrategyService.buildPlan(USER_UID, QUERY)).thenReturn(emptyPlan());
        when(userProfileService.buildProfileContext(USER_UID)).thenReturn("Name: Punith, Age: 20");
        when(memoryGraphService.generateProfile(USER_UID))
                .thenReturn(new MemoryGraphService.ContextProfile(List.of(), List.of()));
        when(structuredContextService.buildSnapshot(eq(USER_UID), any())).thenReturn("");

        String context = service.assembleContext(USER_UID, QUERY);

        assertThat(context).contains("USER PROFILE");
        assertThat(context).contains("Name: Punith, Age: 20");
    }

    // ── Layer 2: Structured App Data ──────────────────────────────────────

    @Test
    void structuredSnapshot_appearsInContext() {
        when(memoryRetrievalStrategyService.buildPlan(USER_UID, QUERY)).thenReturn(emptyPlan());
        when(userProfileService.buildProfileContext(USER_UID)).thenReturn("");
        when(memoryGraphService.generateProfile(USER_UID))
                .thenReturn(new MemoryGraphService.ContextProfile(List.of(), List.of()));
        when(structuredContextService.buildSnapshot(eq(USER_UID), any()))
                .thenReturn("=== HABITS ===\n- Morning run | streak: 5d\n\n");

        String context = service.assembleContext(USER_UID, QUERY);

        assertThat(context).contains("HABITS");
        assertThat(context).contains("Morning run");
    }

    @Test
    void structuredSnapshot_isCalledWithDetectedIntents() {
        when(memoryRetrievalStrategyService.buildPlan(USER_UID, QUERY)).thenReturn(emptyPlan());
        when(userProfileService.buildProfileContext(USER_UID)).thenReturn("");
        when(memoryGraphService.generateProfile(USER_UID))
                .thenReturn(new MemoryGraphService.ContextProfile(List.of(), List.of()));
        when(structuredContextService.buildSnapshot(eq(USER_UID), any())).thenReturn("");

        service.assembleContext(USER_UID, QUERY);

        // Verify intent set from plan (GENERAL) is passed to structured context service
        verify(structuredContextService).buildSnapshot(
                eq(USER_UID),
                argThat(intents -> intents.contains(QueryIntentClassifier.Intent.GENERAL)));
    }

    // ── Layer 1: RAG retrieval ─────────────────────────────────────────────

    @Test
    void memoryLines_appearInMemoriesBlock() {
        when(memoryRetrievalStrategyService.buildPlan(USER_UID, QUERY))
                .thenReturn(planWith(List.of("- Punith studies CSE [personal]"), List.of()));
        when(userProfileService.buildProfileContext(USER_UID)).thenReturn("");
        when(memoryGraphService.generateProfile(USER_UID))
                .thenReturn(new MemoryGraphService.ContextProfile(List.of(), List.of()));
        when(structuredContextService.buildSnapshot(eq(USER_UID), any())).thenReturn("");

        String context = service.assembleContext(USER_UID, QUERY);

        assertThat(context).contains("MEMORIES");
        assertThat(context).contains("Punith studies CSE");
    }

    @Test
    void vectorLines_appearInKnowledgeDocumentsBlock() {
        when(memoryRetrievalStrategyService.buildPlan(USER_UID, QUERY))
                .thenReturn(planWith(List.of(), List.of("- [note] Spring Boot tips")));
        when(userProfileService.buildProfileContext(USER_UID)).thenReturn("");
        when(memoryGraphService.generateProfile(USER_UID))
                .thenReturn(new MemoryGraphService.ContextProfile(List.of(), List.of()));
        when(structuredContextService.buildSnapshot(eq(USER_UID), any())).thenReturn("");

        String context = service.assembleContext(USER_UID, QUERY);

        assertThat(context).contains("KNOWLEDGE: DOCUMENTS");
        assertThat(context).contains("Spring Boot tips");
    }

    // ── buildFullSystemPrompt ─────────────────────────────────────────────

    @Test
    void nonEmptyContext_isWrappedInContextMarkers() {
        when(memoryRetrievalStrategyService.buildPlan(USER_UID, QUERY)).thenReturn(emptyPlan());
        when(userProfileService.buildProfileContext(USER_UID)).thenReturn("Name: Punith");
        when(memoryGraphService.generateProfile(USER_UID))
                .thenReturn(new MemoryGraphService.ContextProfile(List.of(), List.of()));
        when(structuredContextService.buildSnapshot(eq(USER_UID), any())).thenReturn("");

        String full = service.buildFullSystemPrompt("You are a helpful assistant.", USER_UID, "chat_buddy", QUERY);

        assertThat(full).startsWith("You are a helpful assistant.");
        assertThat(full).contains("[CONTEXT");
        assertThat(full).contains("[END CONTEXT]");
        assertThat(full).contains("Name: Punith");
    }

    // ── Layer isolation ────────────────────────────────────────────────────

    @Test
    void profileSection_doesNotLeakIntoKnowledgeSection() {
        when(memoryRetrievalStrategyService.buildPlan(USER_UID, QUERY))
                .thenReturn(planWith(List.of(), List.of("- [note] doc about Java")));
        when(userProfileService.buildProfileContext(USER_UID)).thenReturn("occupation: engineer");
        when(memoryGraphService.generateProfile(USER_UID))
                .thenReturn(new MemoryGraphService.ContextProfile(
                        List.of("Long-term static fact"), List.of()));
        when(structuredContextService.buildSnapshot(eq(USER_UID), any())).thenReturn("");

        String context = service.assembleContext(USER_UID, QUERY);

        int profileEnd = context.indexOf("Long-term facts");
        int docsStart  = context.indexOf("KNOWLEDGE: DOCUMENTS");
        // Profile section must appear before the knowledge section
        assertThat(profileEnd).isLessThan(docsStart);
    }
}
