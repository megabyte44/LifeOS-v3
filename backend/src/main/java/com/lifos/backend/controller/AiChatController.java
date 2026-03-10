package com.lifos.backend.controller;

import com.lifos.backend.dto.AiChatRequest;
import com.lifos.backend.dto.AiChatResponse;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.AiChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping("/chat")
    public AiChatResponse chat(@RequestBody AiChatRequest req) {
        return aiChatService.chat(req, SecurityUtils.getCurrentUserUid());
    }
}
