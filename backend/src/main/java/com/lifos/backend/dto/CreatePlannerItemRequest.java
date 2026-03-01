package com.lifos.backend.dto;

import lombok.Data;

@Data
public class CreatePlannerItemRequest {
    private String startTime;
    private String endTime;
    private String title;
    private String tag;
}
