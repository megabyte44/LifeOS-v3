package com.lifos.backend.dto;

import lombok.Data;

@Data
public class PushSubscribeRequest {
    private PushSubscriptionJson subscription;

    @Data
    public static class PushSubscriptionJson {
        private String endpoint;
        private Long expirationTime;
        private PushKeys keys;

        @Data
        public static class PushKeys {
            private String p256dh;
            private String auth;
        }
    }
}
