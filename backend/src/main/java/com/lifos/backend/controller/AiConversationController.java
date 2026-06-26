package com.lifos.backend.controller;

import com.lifos.backend.dto.AiChatHistoryItemResponse;
import com.lifos.backend.dto.AiConversationResponse;
import com.lifos.backend.dto.RenameConversationRequest;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.AiConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/ai/conversations", "/api/ai/conversations"})
@RequiredArgsConstructor
public class AiConversationController {

    private final AiConversationService aiConversationService;

    /** GET /api/ai/conversations — sidebar list (metadata only, no messages) */
    @GetMapping
    public List<AiConversationResponse> listConversations() {
        return aiConversationService.listConversations(SecurityUtils.getCurrentUserUid());
    }

    /** GET /api/ai/conversations/{id}/messages — lazy message load for a single conversation */
    @GetMapping("/{id}/messages")
    public List<AiChatHistoryItemResponse> getMessages(@PathVariable UUID id) {
        return aiConversationService.getMessages(id, SecurityUtils.getCurrentUserUid());
    }

    /** PATCH /api/ai/conversations/{id} — rename a conversation */
    @PatchMapping("/{id}")
    public AiConversationResponse rename(
            @PathVariable UUID id,
            @RequestBody @Valid RenameConversationRequest req) {
        return aiConversationService.renameConversation(id, SecurityUtils.getCurrentUserUid(), req.getTitle());
    }

    /** DELETE /api/ai/conversations/{id} — soft-delete one conversation */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOne(@PathVariable UUID id) {
        aiConversationService.deleteConversation(id, SecurityUtils.getCurrentUserUid());
    }

    /** DELETE /api/ai/conversations — soft-delete all conversations for current user */
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAll() {
        aiConversationService.deleteAllConversations(SecurityUtils.getCurrentUserUid());
    }
}
