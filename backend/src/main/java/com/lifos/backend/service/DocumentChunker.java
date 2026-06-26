package com.lifos.backend.service;

import java.util.ArrayList;
import java.util.List;

/**
 * Stateless utility that splits a long document into overlapping text chunks
 * suitable for individual embedding. Uses paragraph boundaries as natural
 * split points, falling back to character-level splitting when a single
 * paragraph exceeds the max chunk size.
 *
 * <p>Overlap allows semantic continuity across chunk boundaries so that
 * retrieval doesn't miss facts that straddle a split point.
 */
public final class DocumentChunker {

    private DocumentChunker() {}

    public record Chunk(String text, int startChar, int endChar, int index, int total) {}

    /**
     * Splits {@code text} into overlapping chunks.
     *
     * @param text          source document text
     * @param maxChars      maximum characters per chunk (~800 token equivalent)
     * @param overlapChars  characters of overlap between consecutive chunks (~200 token equivalent)
     * @return ordered list of chunks (never empty; single-chunk when text is short)
     */
    public static List<Chunk> chunk(String text, int maxChars, int overlapChars) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        if (text.length() <= maxChars) {
            return List.of(new Chunk(text, 0, text.length(), 0, 1));
        }

        List<String> paragraphs = splitParagraphs(text);
        List<Chunk> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        int currentStart = 0;
        int charCursor = 0;

        for (String para : paragraphs) {
            // If adding this paragraph would overflow, flush current buffer first
            if (current.length() > 0 && current.length() + para.length() > maxChars) {
                String chunkText = current.toString().strip();
                if (!chunkText.isEmpty()) {
                    result.add(new Chunk(chunkText, currentStart, currentStart + current.length(), result.size(), 0));
                }

                // Seed next chunk with overlap from the tail of current buffer
                String tail = current.toString();
                int overlapStart = Math.max(0, tail.length() - overlapChars);
                current = new StringBuilder(tail.substring(overlapStart));
                currentStart = currentStart + overlapStart;
            }

            // Handle paragraphs that are themselves larger than maxChars
            if (para.length() > maxChars) {
                // Flush existing buffer
                if (current.length() > 0) {
                    String chunkText = current.toString().strip();
                    if (!chunkText.isEmpty()) {
                        result.add(new Chunk(chunkText, currentStart, currentStart + current.length(), result.size(), 0));
                    }
                    current = new StringBuilder();
                }
                // Hard-split the oversized paragraph
                int offset = 0;
                while (offset < para.length()) {
                    int end = Math.min(offset + maxChars, para.length());
                    String slice = para.substring(offset, end);
                    result.add(new Chunk(slice, charCursor + offset, charCursor + end, result.size(), 0));
                    offset += maxChars - overlapChars;
                }
                currentStart = charCursor + para.length();
                current = new StringBuilder();
            } else {
                current.append(para).append("\n");
            }

            charCursor += para.length() + 1; // +1 for the newline separator
        }

        // Flush remaining buffer
        if (current.length() > 0) {
            String chunkText = current.toString().strip();
            if (!chunkText.isEmpty()) {
                result.add(new Chunk(chunkText, currentStart, currentStart + current.length(), result.size(), 0));
            }
        }

        // Backfill total count now that we know the final size
        int total = result.size();
        List<Chunk> finalChunks = new ArrayList<>(total);
        for (Chunk c : result) {
            finalChunks.add(new Chunk(c.text(), c.startChar(), c.endChar(), c.index(), total));
        }
        return finalChunks;
    }

    /** Splits text on double-newline paragraph boundaries. */
    private static List<String> splitParagraphs(String text) {
        String[] raw = text.split("\\n\\s*\\n");
        List<String> out = new ArrayList<>(raw.length);
        for (String p : raw) {
            String trimmed = p.strip();
            if (!trimmed.isEmpty()) {
                out.add(trimmed);
            }
        }
        return out;
    }
}
