package com.lifos.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateAiConfigRequest {
    private Map<String, Object> systemInstructions;
    private String defaultPersonality;
    private Map<String, Object> modelConfig;
    private Map<String, Object> apiKeys;
    private Boolean ragEnabled;
    private Boolean insightsEnabled;
    private String insightsCron;
    private Boolean evaluationEnabled;
    private Integer evaluationSampleRate;
}
