package com.lifos.backend.service;

import com.lifos.backend.dto.CreateNotificationRequest;
import com.lifos.backend.dto.NotificationDispatchRequest;
import com.lifos.backend.dto.NotificationResponse;
import com.lifos.backend.dto.PushMessagePayload;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationDispatchService {

    private static final String DEFAULT_ICON = "/favicon.jpeg";
    private static final String DEFAULT_BADGE = "/icon.svg";

    private final NotificationService notificationService;
    private final WebPushService webPushService;

    @Transactional
    public DispatchResult dispatch(String uid, NotificationDispatchRequest request) {
        log.info("Dispatching notification '{}' to user [{}] (sourceType={})", request.getTitle(), uid, request.getSourceType());
        NotificationResponse stored = notificationService.create(uid, CreateNotificationRequest.builder()
                .title(request.getTitle())
                .date(request.getDate())
                .message(request.getMessage())
                .read(false)
                .sourceType(request.getSourceType())
                .sourceId(request.getSourceId())
                .actionUrl(request.getActionUrl())
                .build());

        PushMessagePayload payload = PushMessagePayload.builder()
                .title(request.getTitle())
                .body(request.getMessage())
                .icon(DEFAULT_ICON)
                .badge(DEFAULT_BADGE)
                .tag(request.getTag())
                .data(PushMessagePayload.PayloadData.builder()
                        .url(request.getActionUrl())
                        .sourceType(request.getSourceType())
                        .sourceId(request.getSourceId())
                        .build())
                .build();

        int sentCount = webPushService.sendToUser(uid, payload);
        log.debug("Notification dispatched to user [{}] — pushSentCount={}", uid, sentCount);
        return DispatchResult.builder()
                .notification(stored)
                .pushSentCount(sentCount)
                .build();
    }

    @Value
    @Builder
    public static class DispatchResult {
        NotificationResponse notification;
        int pushSentCount;
    }
}