package com.lifos.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lifos.backend.dto.AiChatHistoryItemResponse;
import com.lifos.backend.dto.AiChatRequest;
import com.lifos.backend.entity.AiChatHistory;
import com.lifos.backend.entity.AiConversation;
import com.lifos.backend.entity.User;
import com.lifos.backend.repository.AiChatHistoryRepository;
import com.lifos.backend.repository.AiConversationRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.lang.Nullable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatHistoryService {

    private final AiChatHistoryRepository aiChatHistoryRepository;
    private final AiConversationRepository aiConversationRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Async
    @Transactional
    public void saveExchange(String userUid,
                             AiChatRequest req,
                             String provider,
                             String resolvedModel,
                             String userMessage,
                             String assistantMessage,
                             @Nullable UUID conversationId) {
        try {
            if (userMessage == null || userMessage.isBlank() || assistantMessage == null || assistantMessage.isBlank()) {
                return;
            }

            User user = userRepository.findById(userUid).orElse(null);
            if (user == null) {
                return;
            }

            ObjectNode metadata = objectMapper.createObjectNode();
            metadata.put("messageCount", req.getMessages() != null ? req.getMessages().size() : 0);
            metadata.put("savedAt", Instant.now().toString());

            AiChatHistory.AiChatHistoryBuilder builder = AiChatHistory.builder()
                    .user(user)
                    .mode(req.getMode() != null && !req.getMode().isBlank() ? req.getMode() : "normal")
                    .personality(req.getPersonality())
                    .provider(provider)
                    .model(resolvedModel)
                    .userMessage(trimForStorage(userMessage, 8000))
                    .assistantMessage(trimForStorage(assistantMessage, 16000))
                    .requestMessages(req.getMessages() != null ? objectMapper.valueToTree(req.getMessages()) : null)
                    .responseMetadata(metadata);

            // Link to conversation and update its lastMessageAt
            if (conversationId != null) {
                aiConversationRepository.findById(conversationId).ifPresent(conv -> {
                    builder.conversation(conv);
                    conv.setLastMessageAt(Instant.now());
                    aiConversationRepository.save(conv);
                });
            }

            aiChatHistoryRepository.save(builder.build());
        } catch (Exception ex) {
            log.warn("Failed to persist AI chat history for user [{}]: {}", userUid, ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<AiChatHistoryItemResponse> getHistory(String userUid, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        return aiChatHistoryRepository.findByUserUidOrderByCreatedAtDesc(userUid, PageRequest.of(0, safeLimit))
                .stream()
                .map(h -> AiChatHistoryItemResponse.builder()
                        .id(h.getId().toString())
                        .mode(h.getMode())
                        .personality(h.getPersonality())
                        .provider(h.getProvider())
                        .model(h.getModel())
                        .userMessage(h.getUserMessage())
                        .assistantMessage(h.getAssistantMessage())
                        .createdAt(h.getCreatedAt() != null ? h.getCreatedAt().toString() : null)
                        .build())
                .toList();
    }

    @Transactional
    public void clearHistory(String userUid) {
        aiChatHistoryRepository.deleteAllByUserUid(userUid);
    }

    private String trimForStorage(String text, int maxLen) {
        if (text == null) {
            return "";
        }
        if (text.length() <= maxLen) {
            return text;
        }
        return text.substring(0, maxLen);
    }
}
