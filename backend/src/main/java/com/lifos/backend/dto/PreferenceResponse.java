package com.lifos.backend.dto;

import lombok.*;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreferenceResponse {
    private Map<String, Object> features;
    private Map<String, Object> onboarding;
}
