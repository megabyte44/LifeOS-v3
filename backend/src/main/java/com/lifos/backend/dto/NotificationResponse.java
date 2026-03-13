package com.lifos.backend.dto;

import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private String id;
    private String title;
    private String date;
    private String message;
    private Boolean read;
    private String sourceType;
    private String sourceId;
    private String actionUrl;
    private Instant createdAt;
}
