package com.lifos.backend.dto;

import lombok.Data;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
public class SystemSettingsResponse {
    private UUID id;
    private Map<String, Object> features;
    private Map<String, Object> maintenance;
    private Map<String, Object> limits;
    private Instant updatedAt;
    private String updatedBy;
}
