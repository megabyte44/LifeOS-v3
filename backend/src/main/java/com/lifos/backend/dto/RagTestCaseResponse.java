package com.lifos.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RagTestCaseResponse {
    private String id;
    private String question;
    private String expectedAnswer;
    private String category;
    private String createdBy;
    private String createdAt;
}
