package com.lifos.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiChatRequest {
    private List<AiMessage> messages;
    private String personality;    // 'casual' | 'professional'
    private String model;          // optional override
    private String mode;           // 'normal' (default) | 'chat_buddy'

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AiMessage {
        private String role;      // 'user' | 'assistant' | 'system'
        private String content;
    }
}
