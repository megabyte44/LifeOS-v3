package com.lifos.backend.dto;

import lombok.Data;

@Data
public class RagTestCaseRequest {
    private String question;
    private String expectedAnswer;
    private String category;
}
