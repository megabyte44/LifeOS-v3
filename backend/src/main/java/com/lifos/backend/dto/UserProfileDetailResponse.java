package com.lifos.backend.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDetailResponse {
    private String uid;
    private Integer age;
    private String bio;
    private String philosophy;
    private JsonNode interests;
    private String occupation;
    private String timezone;
    private String lifeMotto;
    private String lifeSummary;
    private Double sleepTargetHours;
    private Integer dailyCalorieTarget;
    private Integer proteinTargetOverride;
    private Integer profileCompleteness;
    private JsonNode pendingQuestions;
    private JsonNode enrichmentSources;
    private String lastEnrichedAt;
    private String createdAt;
    private String updatedAt;
}
