package com.lifos.backend.dto;

import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
public class AnnouncementResponse {
    private UUID id;
    private String title;
    private String content;
    private String type;
    private String version;
    private Boolean published;
    private Instant publishedAt;
    private Instant createdAt;
    private String createdBy;
}
