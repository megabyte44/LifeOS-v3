package com.lifos.backend.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HabitResponse {
    private String id;
    private String name;
    private String icon;
    private Integer target;
    private Map<String, Object> completions;
    private String habitType;
    private Integer sprintDuration;
    private String sprintEndDate;
    private String sprintStartDate;
    private String context;
}
