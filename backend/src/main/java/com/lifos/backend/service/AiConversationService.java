package com.lifos.backend.service;

import com.lifos.backend.dto.AiChatHistoryItemResponse;
import com.lifos.backend.dto.AiConversationResponse;
import com.lifos.backend.entity.AiConversation;
import com.lifos.backend.entity.User;
import com.lifos.backend.repository.AiChatHistoryRepository;
import com.lifos.backend.repository.AiConversationRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiConversationService {

    private final AiConversationRepository aiConversationRepository;
    private final AiChatHistoryRepository aiChatHistoryRepository;
    private final UserRepository userRepository;

    /**
     * Lazily resolves or creates the conversation for a chat request.
     * - conversationIdStr == null → create a new conversation and return its UUID
     * - conversationIdStr != null → validate ownership, return the existing UUID
     */
    @Transactional
    public UUID ensureConversation(@Nullable String conversationIdStr,
                                   String userUid,
                                   String personality,
                                   String mode,
                                   String autoTitleText) {
        if (conversationIdStr == null || conversationIdStr.isBlank()) {
            // Create new conversation
            User user = userRepository.findById(userUid)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

            String title = buildAutoTitle(autoTitleText);
            String resolvedMode = (mode != null && !mode.isBlank()) ? mode : "normal";

            AiConversation conv = AiConversation.builder()
                    .user(user)
                    .title(title)
                    .personality(personality)
                    .mode(resolvedMode)
                    .build();

            aiConversationRepository.save(conv);
            log.debug("Created new conversation [{}] for user [{}]", conv.getId(), userUid);
            return conv.getId();
        }

        // Validate existing conversation
        UUID conversationId;
        try {
            conversationId = UUID.fromString(conversationIdStr);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid conversationId format");
        }

        AiConversation conv = aiConversationRepository.findByIdAndDeletedFalse(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));

        if (!conv.getUser().getUid().equals(userUid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your conversation");
        }

        return conversationId;
    }

    @Transactional(readOnly = true)
    public List<AiConversationResponse> listConversations(String userUid) {
        return aiConversationRepository.findActiveByUserUid(userUid)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AiChatHistoryItemResponse> getMessages(UUID conversationId, String userUid) {
        AiConversation conv = aiConversationRepository.findByIdAndDeletedFalse(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));

        if (!conv.getUser().getUid().equals(userUid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your conversation");
        }

        return aiChatHistoryRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
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
    public AiConversationResponse renameConversation(UUID id, String userUid, String newTitle) {
        AiConversation conv = aiConversationRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));

        if (!conv.getUser().getUid().equals(userUid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your conversation");
        }

        conv.setTitle(newTitle.strip());
        aiConversationRepository.save(conv);
        return toResponse(conv);
    }

    @Transactional
    public void deleteConversation(UUID id, String userUid) {
        AiConversation conv = aiConversationRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));

        if (!conv.getUser().getUid().equals(userUid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your conversation");
        }

        conv.setDeleted(true);
        aiConversationRepository.save(conv);
    }

    @Transactional
    public void deleteAllConversations(String userUid) {
        aiConversationRepository.softDeleteAllByUserUid(userUid);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private AiConversationResponse toResponse(AiConversation c) {
        return AiConversationResponse.builder()
                .id(c.getId().toString())
                .title(c.getTitle())
                .personality(c.getPersonality())
                .mode(c.getMode())
                .lastMessageAt(c.getLastMessageAt() != null ? c.getLastMessageAt().toString() : null)
                .createdAt(c.getCreatedAt() != null ? c.getCreatedAt().toString() : null)
                .build();
    }

    private String buildAutoTitle(String text) {
        if (text == null || text.isBlank()) return "New Chat";
        String cleaned = text.strip().replace("\n", " ").replace("\r", " ");
        return cleaned.length() <= 80 ? cleaned : cleaned.substring(0, 80);
    }
}
