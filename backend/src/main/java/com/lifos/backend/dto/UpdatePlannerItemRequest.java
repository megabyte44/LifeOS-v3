package com.lifos.backend.dto;

import lombok.Data;

@Data
public class UpdatePlannerItemRequest {
    private String startTime;
    private String endTime;
    private String title;
    private String tag;
}
