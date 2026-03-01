package com.lifos.backend.dto;

import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
public class ProteinIntakeResponse {
    private UUID id;
    private Integer amount;
    private Instant timestamp;
}
