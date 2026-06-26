package com.lifos.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RagEvaluationResponse {
    private String id;
    private String question;
    private String answer;
    private String personality;
    private String modelUsed;
    private Float faithfulness;
    private Float answerRelevancy;
    private Float contextPrecision;
    private Integer contextTokenCount;
    private Long responseTimeMs;
    private String createdAt;
}
