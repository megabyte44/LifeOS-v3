package com.lifos.backend.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class CreateFoodLogItemRequest {
    private String name;
    private Instant timestamp;
}
