package com.lifos.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {
    private String title;
    private String date;
    private String message;
    private Boolean read;
    private String sourceType;
    private String sourceId;
    private String actionUrl;
}
