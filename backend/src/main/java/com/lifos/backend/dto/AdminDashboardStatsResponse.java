package com.lifos.backend.dto;

import lombok.Data;

@Data
public class AdminDashboardStatsResponse {
    private long totalUsers;
    private long totalAiMessages;
}
