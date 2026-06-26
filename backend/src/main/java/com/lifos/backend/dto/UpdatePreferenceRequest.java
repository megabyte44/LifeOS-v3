package com.lifos.backend.dto;

import lombok.*;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePreferenceRequest {
    private Map<String, Object> features;
    private Map<String, Object> onboarding;
}
