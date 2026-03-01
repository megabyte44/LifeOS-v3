package com.lifos.backend.dto;

import lombok.Data;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
public class AiConfigurationResponse {
    private UUID id;
    private Map<String, Object> systemInstructions;
    private String defaultPersonality;
    private Map<String, Object> modelConfig;
    private Map<String, Object> apiKeys;
    private Boolean ragEnabled;
    private Instant updatedAt;
    private String updatedBy;
}
