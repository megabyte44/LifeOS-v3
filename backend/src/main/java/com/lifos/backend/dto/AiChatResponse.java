package com.lifos.backend.dto;

import lombok.Data;

@Data
public class AiChatResponse {
    private String result;
    private String model;
    private String conversationId; // UUID of the conversation this exchange was saved under
}
