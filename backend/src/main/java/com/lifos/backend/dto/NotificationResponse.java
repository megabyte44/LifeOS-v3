package com.lifos.backend.dto;

import lombok.*;

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
}
