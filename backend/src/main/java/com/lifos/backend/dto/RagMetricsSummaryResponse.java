package com.lifos.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class RagMetricsSummaryResponse {
    private double avgFaithfulness;
    private double avgAnswerRelevancy;
    private double avgContextPrecision;
    private long count;
    private int days;
    /** Daily data points for trend charts. */
    private List<DailyPoint> history;

    @Data
    @Builder
    public static class DailyPoint {
        private String date;
        private double faithfulness;
        private double answerRelevancy;
        private double contextPrecision;
        private long count;
    }
}
