package com.lifos.backend.dto;

import lombok.Data;
import java.util.Map;

@Data
public class UpdateSystemSettingsRequest {
    private Map<String, Object> features;
    private Map<String, Object> maintenance;
    private Map<String, Object> limits;
}
