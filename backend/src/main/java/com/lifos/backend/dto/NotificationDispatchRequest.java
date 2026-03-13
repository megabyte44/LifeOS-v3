package com.lifos.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDispatchRequest {
    private String title;
    private String message;
    private String date;
    private String sourceType;
    private String sourceId;
    private String actionUrl;
    private String tag;
}