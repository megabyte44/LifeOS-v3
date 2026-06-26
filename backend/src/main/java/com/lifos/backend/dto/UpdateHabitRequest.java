package com.lifos.backend.dto;

import lombok.*;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateHabitRequest {
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
