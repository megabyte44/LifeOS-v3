package com.lifos.backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {
    private String title;
    private String date;
    private String message;
    private Boolean read;
}
