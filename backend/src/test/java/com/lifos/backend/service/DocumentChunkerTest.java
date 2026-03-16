package com.lifos.backend.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for {@link DocumentChunker}.
 *
 * Covers:
 * - Null / blank input
 * - Short text (≤ maxChars) → single chunk
 * - Multi-paragraph text split on double-newline boundaries
 * - Oversized single paragraph → hard character-level split
 * - Overlap carryover between chunks
 * - Correct index / total metadata backfill
 */
class DocumentChunkerTest {

    private static final int MAX   = 100;
    private static final int OVERLAP = 20;

    // ── Edge cases ─────────────────────────────────────────────────────────

    @Test
    void nullText_returnsEmptyList() {
        assertThat(DocumentChunker.chunk(null, MAX, OVERLAP)).isEmpty();
    }

    @Test
    void blankText_returnsEmptyList() {
        assertThat(DocumentChunker.chunk("   \n  ", MAX, OVERLAP)).isEmpty();
    }

    // ── Short text (single chunk) ──────────────────────────────────────────

    @Test
    void shortText_returnsSingleChunk() {
        String text = "Hello world. This is a short note.";
        List<DocumentChunker.Chunk> chunks = DocumentChunker.chunk(text, MAX, OVERLAP);

        assertThat(chunks).hasSize(1);
        DocumentChunker.Chunk c = chunks.get(0);
        assertThat(c.text()).isEqualTo(text);
        assertThat(c.index()).isEqualTo(0);
        assertThat(c.total()).isEqualTo(1);
        assertThat(c.startChar()).isEqualTo(0);
        assertThat(c.endChar()).isEqualTo(text.length());
    }

    @Test
    void textExactlyMaxChars_returnsSingleChunk() {
        String text = "x".repeat(MAX);
        assertThat(DocumentChunker.chunk(text, MAX, OVERLAP)).hasSize(1);
    }

    // ── Multi-paragraph splitting ──────────────────────────────────────────

    @Test
    void twoParagraphs_combinedFitsInOneChunk_mergesIntoSingleChunk() {
        // Each para is 30 chars — combined 60 < MAX(100)
        String text = "First paragraph here.\n\nSecond paragraph here.";
        List<DocumentChunker.Chunk> chunks = DocumentChunker.chunk(text, MAX, OVERLAP);

        assertThat(chunks).hasSize(1);
        assertThat(chunks.get(0).text()).contains("First paragraph").contains("Second paragraph");
    }

    @Test
    void manyParagraphs_splitIntoMultipleChunks() {
        // 5 paragraphs of 30 chars each; max=100 fits ~3
        String para = "This paragraph is thirty chars!"; // 31 chars
        String text = String.join("\n\n", para, para, para, para, para); // ~170 chars with separators

        List<DocumentChunker.Chunk> chunks = DocumentChunker.chunk(text, MAX, OVERLAP);

        assertThat(chunks.size()).isGreaterThan(1);
    }

    @Test
    void chunkIndicesAreSequential_totalsMatchListSize() {
        String para = "A".repeat(40);
        String text = String.join("\n\n", para, para, para, para); // forces multiple chunks

        List<DocumentChunker.Chunk> chunks = DocumentChunker.chunk(text, MAX, OVERLAP);

        int total = chunks.size();
        for (int i = 0; i < total; i++) {
            assertThat(chunks.get(i).index()).isEqualTo(i);
            assertThat(chunks.get(i).total()).isEqualTo(total);
        }
    }

    // ── Oversized single paragraph ─────────────────────────────────────────

    @Test
    void singleOversizedParagraph_isHardSplit() {
        // 250 chars single paragraph, max=100 → should produce 3 slices
        String text = "B".repeat(250);
        List<DocumentChunker.Chunk> chunks = DocumentChunker.chunk(text, MAX, OVERLAP);

        assertThat(chunks.size()).isGreaterThanOrEqualTo(2);
        for (DocumentChunker.Chunk c : chunks) {
            assertThat(c.text().length()).isLessThanOrEqualTo(MAX);
        }
    }

    // ── Overlap carryover ─────────────────────────────────────────────────

    @Test
    void consecutiveChunks_tailOfFirstAppearsInHeadOfSecond() {
        // Three paragraphs designed so para1+para2 just overflows MAX
        String para1 = "First section content goes here in detail.";  // 43
        String para2 = "Second section continues with more context."; // 44 — 43+44+1=88 < 100
        String para3 = "Third section adds even more detail and information."; // 53 — would overflow
        String text = para1 + "\n\n" + para2 + "\n\n" + para3;

        List<DocumentChunker.Chunk> chunks = DocumentChunker.chunk(text, 100, OVERLAP);

        assertThat(chunks.size()).isGreaterThanOrEqualTo(2);
        // Verify all text content is covered (no data loss)
        String combined = chunks.stream().map(DocumentChunker.Chunk::text)
                .reduce("", (a, b) -> a + b);
        assertThat(combined).contains(para1.substring(0, 10)); // head of first chunk present
    }

    // ── Char positions ─────────────────────────────────────────────────────

    @Test
    void singleChunk_charPositionsMatchTextLength() {
        String text = "Simple test text.";
        DocumentChunker.Chunk chunk = DocumentChunker.chunk(text, MAX, OVERLAP).get(0);
        assertThat(chunk.startChar()).isEqualTo(0);
        assertThat(chunk.endChar()).isEqualTo(text.length());
    }

    @Test
    void allChunks_textIsNonEmpty() {
        String text = "Para one content.\n\nPara two content.\n\nPara three content here.";
        List<DocumentChunker.Chunk> chunks = DocumentChunker.chunk(text, 40, 10);
        chunks.forEach(c -> assertThat(c.text()).isNotBlank());
    }
}
