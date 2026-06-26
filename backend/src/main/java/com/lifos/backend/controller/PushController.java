package com.lifos.backend.controller;

import com.lifos.backend.dto.NotificationDispatchRequest;
import com.lifos.backend.dto.PushSubscribeRequest;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.NotificationDispatchService;
import com.lifos.backend.service.WebPushService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/push")
@RequiredArgsConstructor
public class PushController {

    private final WebPushService webPushService;
    private final NotificationDispatchService notificationDispatchService;

    @PostMapping("/subscribe")
    public Map<String, Object> subscribe(@RequestBody PushSubscribeRequest req) {
        return webPushService.subscribe(SecurityUtils.getCurrentUserUid(), req);
    }

    @PostMapping("/unsubscribe")
    public Map<String, Object> unsubscribe(@RequestBody Map<String, String> body) {
        return webPushService.unsubscribe(SecurityUtils.getCurrentUserUid(), body.get("endpoint"));
    }

    @PostMapping("/send-test")
    public Map<String, Object> sendTest() {
        NotificationDispatchService.DispatchResult result = notificationDispatchService.dispatch(
            SecurityUtils.getCurrentUserUid(),
            NotificationDispatchRequest.builder()
                .title("LifeOS")
                .message("Push notifications are working!")
                .date(LocalDate.now().toString())
                .sourceType("system")
                .actionUrl("/notifications")
                .tag("system:test")
                .build()
        );

        return Map.of(
            "success", true,
            "message", "Test notification created and sent to " + result.getPushSentCount() + " subscription(s)."
        );
    }
}
