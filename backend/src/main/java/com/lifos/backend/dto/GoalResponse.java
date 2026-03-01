package com.lifos.backend.dto;

import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class GoalResponse {
    private UUID id;
    private String title;
    private String category;
    private String goalType;
    private String motive;
    private String description;
    private List<String> linkedHabitIds;
    private String startDate;
    private String targetDate;
    private Instant completedAt;
    private Boolean archived;
    private Instant createdAt;
    private Instant updatedAt;
    private List<ProgressTrackerDto> progressTrackers;
    private List<SubGoalDto> subGoals;
    private List<GoalNoteDto> notes;
    private List<GoalResourceDto> resources;
}
