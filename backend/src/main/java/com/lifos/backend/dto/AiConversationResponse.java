package com.lifos.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiConversationResponse {
    private String id;
    private String title;
    private String personality;
    private String mode;
    private String lastMessageAt;  // ISO-8601, nullable
    private String createdAt;
}
