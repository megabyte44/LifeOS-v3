package com.lifos.backend.service;

import com.lifos.backend.entity.Embedding;
import com.lifos.backend.entity.User;
import com.lifos.backend.repository.EmbeddingRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmbeddingService {

    private final EmbeddingRepository embeddingRepository;
    private final UserRepository userRepository;
    private final OpenAiEmbeddingClient openAiEmbeddingClient;

    @Transactional
    public void embedAndStore(String userUid, String sourceType, UUID sourceId, String text) {
        if (text == null || text.isBlank()) {
            return;
        }

        String contentHash = computeHash(text);
        Optional<Embedding> existing = embeddingRepository.findBySourceTypeAndSourceId(sourceType, sourceId);

        if (existing.isPresent() && existing.get().getContentHash().equals(contentHash)) {
            log.debug("Content unchanged for {} {}, skipping embedding.", sourceType, sourceId);
            return;
        }

        float[] vector = openAiEmbeddingClient.getEmbedding(truncateText(text, 8000));
        User user = userRepository.findById(userUid)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userUid));

        Embedding embedding = existing.orElse(Embedding.builder()
                .user(user)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .createdAt(Instant.now())
                .build());

        embedding.setContentHash(contentHash);
        embedding.setContentPreview(text.substring(0, Math.min(text.length(), 200)));
        embedding.setEmbedding(floatArrayToString(vector));
        embedding.setUpdatedAt(Instant.now());

        embeddingRepository.save(embedding);
        log.info("Stored embedding for {} {}", sourceType, sourceId);
    }

    @Transactional
    public void deleteBySource(String sourceType, UUID sourceId) {
        embeddingRepository.deleteBySourceTypeAndSourceId(sourceType, sourceId);
        log.info("Deleted embedding for {} {}", sourceType, sourceId);
    }

    public List<Embedding> searchSimilar(String userUid, String queryText, int limit) {
        float[] queryVector = openAiEmbeddingClient.getEmbedding(queryText);
        return embeddingRepository.findSimilar(userUid, queryVector, limit);
    }

    private String computeHash(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private String truncateText(String text, int maxChars) {
        // Rough estimate of tokens for text-embedding-3-small
        if (text.length() <= maxChars) return text;
        return text.substring(0, maxChars);
    }

    private String floatArrayToString(float[] vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(vector[i]);
        }
        sb.append("]");
        return sb.toString();
    }
}
