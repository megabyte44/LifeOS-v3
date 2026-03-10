package com.lifos.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class AiChatRequest {
    private List<AiMessage> messages;
    private String personality;    // 'casual' | 'professional'
    private String model;          // optional override
    private String mode;           // 'normal' (default) | 'chat_buddy'

    @Data
    public static class AiMessage {
        private String role;      // 'user' | 'assistant' | 'system'
        private String content;
    }
}
