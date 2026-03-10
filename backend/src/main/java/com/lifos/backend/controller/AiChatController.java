package com.lifos.backend.controller;

import com.lifos.backend.dto.AiChatRequest;
import com.lifos.backend.dto.AiChatResponse;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.AiChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

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
}

