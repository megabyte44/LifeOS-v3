package com.lifos.backend.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class CreateProteinIntakeRequest {
    private Integer amount;
    private Instant timestamp;
}
