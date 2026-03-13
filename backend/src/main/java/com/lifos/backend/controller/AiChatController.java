package com.lifos.backend.controller;

import com.lifos.backend.dto.AiChatRequest;
import com.lifos.backend.dto.AiChatResponse;
import com.lifos.backend.entity.ConversationMemory;
import com.lifos.backend.repository.ConversationMemoryRepository;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.AiChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;
    private final ConversationMemoryRepository memoryRepository;

    @PostMapping("/chat")
    public AiChatResponse chat(@RequestBody AiChatRequest req) {
        return aiChatService.chat(req, SecurityUtils.getCurrentUserUid());
    }

    @PostMapping("/chat/stream")
    public SseEmitter streamChat(@RequestBody AiChatRequest req) {
        SseEmitter emitter = new SseEmitter(120_000L);
        aiChatService.streamChat(req, SecurityUtils.getCurrentUserUid(), emitter);
        return emitter;
    }

    // ── Conversation Memories ─────────────────────────────────────────────────

    /** GET /api/ai/memories — returns all active memories for the current user */
    @GetMapping("/memories")
    public List<ConversationMemory> getMemories() {
        return memoryRepository.findByUserUidAndActiveTrueOrderByCreatedAtAsc(
                SecurityUtils.getCurrentUserUid());
    }

    /** DELETE /api/ai/memories/{id} — soft-deactivates a single memory */
    @DeleteMapping("/memories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMemory(@PathVariable UUID id) {
        String uid = SecurityUtils.getCurrentUserUid();
        ConversationMemory memory = memoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Memory not found"));
        if (!memory.getUser().getUid().equals(uid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your memory");
        }
        memory.setActive(false);
        memoryRepository.save(memory);
    }
}

