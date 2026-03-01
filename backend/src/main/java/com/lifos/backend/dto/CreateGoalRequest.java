package com.lifos.backend.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CreateGoalRequest {
    private String title;
    private String category;
    private String goalType;
    private String motive;
    private String description;
    private List<String> linkedHabitIds = new ArrayList<>();
    private String startDate;
    private String targetDate;
    private List<ProgressTrackerDto> progressTrackers = new ArrayList<>();
    private List<SubGoalDto> subGoals = new ArrayList<>();
    private List<GoalNoteDto> notes = new ArrayList<>();
    private List<GoalResourceDto> resources = new ArrayList<>();
}
