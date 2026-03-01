package com.lifos.backend.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class ProgressTrackerDto {
    private UUID id;
    private String type;
    private String label;
    private Double current;
    private Double target;
    private Integer stars;
    private Integer maxStars;
    private String status;
    private Integer totalDots;
    private Integer filledDots;
    private Integer order;
}
