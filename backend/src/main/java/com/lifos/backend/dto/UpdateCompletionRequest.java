package com.lifos.backend.dto;

import lombok.Data;

@Data
public class UpdateCompletionRequest {
    private String date;       // 'yyyy-MM-dd'
    private Boolean completed;
}
