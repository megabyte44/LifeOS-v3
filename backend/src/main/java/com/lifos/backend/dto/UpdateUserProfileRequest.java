package com.lifos.backend.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserProfileRequest {
    private Integer age;
    private String bio;
    private String philosophy;
    private JsonNode interests;
    private String occupation;
    private String timezone;
    private String lifeMotto;
    private Double sleepTargetHours;
    private Integer dailyCalorieTarget;
    private Integer proteinTargetOverride;
}
