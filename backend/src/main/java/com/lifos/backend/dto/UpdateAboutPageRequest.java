package com.lifos.backend.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class UpdateAboutPageRequest {
    private String title;
    private String description;
    private String version;
    private String markdownContent;
    private List<Object> features;
    private Map<String, Object> contact;
}
