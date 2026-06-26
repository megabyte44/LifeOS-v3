package com.lifos.backend.dto;

import lombok.Data;

@Data
public class CreateAnnouncementRequest {
    private String title;
    private String content;
    private String type;
    private String version;
    private Boolean published;
}
