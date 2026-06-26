package com.lifos.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DailyMessageCount {
    private String date;   // "2025-03-15"
    private long count;
}
