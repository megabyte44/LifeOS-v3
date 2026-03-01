package com.lifos.backend.dto;

import lombok.Data;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class AboutPageResponse {
    private UUID id;
    private String title;
    private String description;
    private String version;
    private String markdownContent;
    private List<Object> features;
    private Map<String, Object> contact;
    private Instant updatedAt;
    private String updatedBy;
}
