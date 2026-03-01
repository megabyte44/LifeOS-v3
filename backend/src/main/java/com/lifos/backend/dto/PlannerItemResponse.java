package com.lifos.backend.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class PlannerItemResponse {
    private UUID id;
    private String day;
    private String startTime;
    private String endTime;
    private String title;
    private String tag;
}
