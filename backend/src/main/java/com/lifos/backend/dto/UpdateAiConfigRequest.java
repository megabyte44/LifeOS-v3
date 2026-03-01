package com.lifos.backend.dto;

import lombok.Data;
import java.util.Map;

@Data
public class UpdateAiConfigRequest {
    private Map<String, Object> systemInstructions;
    private String defaultPersonality;
    private Map<String, Object> modelConfig;
    private Map<String, Object> apiKeys;
    private Boolean ragEnabled;
}
