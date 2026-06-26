package com.lifos.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiChatHistoryItemResponse {
    private String id;
    private String mode;
    private String personality;
    private String provider;
    private String model;
    private String userMessage;
    private String assistantMessage;
    private String createdAt;
}
