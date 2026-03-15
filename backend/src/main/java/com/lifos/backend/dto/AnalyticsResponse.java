package com.lifos.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class AnalyticsResponse {
    private List<DailyMessageCount> dailyMessages;
    private List<UserMessageCount> topUsers;
    private long totalMessages;
    private double avgPerDay;
}
