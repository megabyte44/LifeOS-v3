package com.lifos.backend.dto;

import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
public class FoodLogItemResponse {
    private UUID id;
    private String name;
    private Instant timestamp;
}
