package com.lifos.backend.service;

import com.lifos.backend.config.AiFoundationProperties;
import com.lifos.backend.entity.User;
import com.lifos.backend.repository.EmbeddingRepository;
import com.lifos.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the document-chunking path in {@link EmbeddingService}.
 *
 * Covers:
 * - Short text bypasses chunking → single embedAndStore call
 * - Long text is chunked → multiple rows saved, each with parentSourceId
 * - Chunking disabled flag → falls through to single-embedding path
 * - Null / blank text → no-op
 * - Old embeddings are deleted before new chunks are saved
 */
@ExtendWith(MockitoExtension.class)
class EmbeddingServiceChunkingTest {

    @Mock EmbeddingRepository embeddingRepository;
    @Mock UserRepository      userRepository;
    @Mock OpenAiEmbeddingClient openAiEmbeddingClient;

    // We construct EmbeddingService manually so we can inject a configured prop
    EmbeddingService service;

    private final String USER_UID  = "user-123";
    private final UUID   SOURCE_ID = UUID.randomUUID();
    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        when(userRepository.findById(USER_UID)).thenReturn(Optional.of(mockUser));
        when(openAiEmbeddingClient.getEmbedding(anyString()))
                .thenReturn(new float[]{0.1f, 0.2f, 0.3f});
    }

    private AiFoundationProperties propsWithChunking(boolean enabled, int maxChars, int overlap) {
        AiFoundationProperties props = new AiFoundationProperties();
        props.getChunking().setEnableDocumentChunking(enabled);
        props.getChunking().setChunkMaxChars(maxChars);
        props.getChunking().setChunkOverlapChars(overlap);
        service = new EmbeddingService(embeddingRepository, userRepository, openAiEmbeddingClient, props);
        return props;
    }

    // ── Short text (single chunk path) ─────────────────────────────────────

    @Test
    void shortText_chunkingEnabled_singleEmbeddingStored() {
        propsWithChunking(true, 3200, 400);
        String text = "Short note.";

        service.embedChunkedDocument(USER_UID, "note", SOURCE_ID, text);

        // deleteBySourceTypeAndSourceId NOT called (no old chunks to delete)
        verify(embeddingRepository, never()).deleteBySourceTypeAndSourceId(any(), any());
        // Only 1 embedding saved
        verify(embeddingRepository, times(1)).save(any());
    }

    @Test
    void longText_chunkingEnabled_multipleChunksSaved() {
        propsWithChunking(true, 100, 20);
        // Build text that definitely exceeds maxChars=100 by a wide margin
        String para = "This is a paragraph with exactly fifty characters here!!";
        String text = String.join("\n\n", para, para, para, para); // ~240 chars

        service.embedChunkedDocument(USER_UID, "note", SOURCE_ID, text);

        // Old embeddings must be cleared first
        verify(embeddingRepository).deleteBySourceTypeAndSourceId("note", SOURCE_ID);
        // More than 1 chunk saved
        verify(embeddingRepository, atLeast(2)).save(any());
    }

    @Test
    void longText_savedChunks_haveCorrectParentSourceId() {
        propsWithChunking(true, 100, 20);
        String para = "A".repeat(60);
        String text = para + "\n\n" + para + "\n\n" + para; // 3 paragraphs 60+60+60 > 100

        ArgumentCaptor<com.lifos.backend.entity.Embedding> captor =
                ArgumentCaptor.forClass(com.lifos.backend.entity.Embedding.class);

        service.embedChunkedDocument(USER_UID, "note", SOURCE_ID, text);

        verify(embeddingRepository, atLeast(2)).save(captor.capture());
        captor.getAllValues().forEach(e ->
                assertThat(e.getParentSourceId()).isEqualTo(SOURCE_ID));
    }

    @Test
    void longText_savedChunks_chunkIndexesAreSequential() {
        propsWithChunking(true, 100, 20);
        String para = "B".repeat(55);
        String text = para + "\n\n" + para + "\n\n" + para;

        ArgumentCaptor<com.lifos.backend.entity.Embedding> captor =
                ArgumentCaptor.forClass(com.lifos.backend.entity.Embedding.class);

        service.embedChunkedDocument(USER_UID, "note", SOURCE_ID, text);
        verify(embeddingRepository, atLeast(2)).save(captor.capture());

        int capturedCount = captor.getAllValues().size();
        for (int i = 0; i < capturedCount; i++) {
            assertThat(captor.getAllValues().get(i).getChunkIndex()).isEqualTo(i);
        }
    }

    // ── Chunking disabled ──────────────────────────────────────────────────

    @Test
    void chunkingDisabled_longText_singleEmbeddingPath() {
        propsWithChunking(false, 100, 20);
        String text = "A".repeat(500);

        // embedChunkedDocument falls back to embedAndStore which needs hash check
        when(embeddingRepository.findBySourceTypeAndSourceId(anyString(), any()))
                .thenReturn(Optional.empty());

        service.embedChunkedDocument(USER_UID, "note", SOURCE_ID, text);

        // No bulk delete (not chunking)
        verify(embeddingRepository, never()).deleteBySourceTypeAndSourceId(any(), any());
        // 1 save from embedAndStore path
        verify(embeddingRepository, times(1)).save(any());
    }

    // ── Null / blank ───────────────────────────────────────────────────────

    @Test
    void nullText_isNoOp() {
        propsWithChunking(true, 3200, 400);
        service.embedChunkedDocument(USER_UID, "note", SOURCE_ID, null);
        verify(embeddingRepository, never()).save(any());
    }

    @Test
    void blankText_isNoOp() {
        propsWithChunking(true, 3200, 400);
        service.embedChunkedDocument(USER_UID, "note", SOURCE_ID, "   ");
        verify(embeddingRepository, never()).save(any());
    }
}
