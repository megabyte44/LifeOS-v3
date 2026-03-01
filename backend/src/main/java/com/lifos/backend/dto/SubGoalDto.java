package com.lifos.backend.dto;

import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class SubGoalDto {
    private UUID id;
    private UUID parentId;
    private String title;
    private String description;
    private Boolean completed;
    private Instant completedAt;
    private Integer level;
    private Integer order;
    private List<SubGoalDto> children;
}
