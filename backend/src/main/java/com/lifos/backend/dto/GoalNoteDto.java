package com.lifos.backend.dto;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class GoalNoteDto {
    private UUID id;
    private String title;
    private String content;
    private Integer order;
    private Instant createdAt;
    private Instant updatedAt;
}
