package com.lifos.backend.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class GoalResourceDto {
    private UUID id;
    private String type;
    private String title;
    private String url;
    private String description;
    private Integer order;
}
