package com.lifos.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PushMessagePayload {
    private String title;
    private String body;
    private String icon;
    private String badge;
    private String tag;
    private PayloadData data;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PayloadData {
        private String url;
        private String sourceType;
        private String sourceId;
    }
}