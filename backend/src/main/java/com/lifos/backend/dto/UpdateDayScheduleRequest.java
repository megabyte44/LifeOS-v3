package com.lifos.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class UpdateDayScheduleRequest {
    private List<PlannerItemResponse> items;
}
