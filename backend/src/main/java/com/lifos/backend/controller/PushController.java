package com.lifos.backend.controller;

import com.lifos.backend.dto.PushSubscribeRequest;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.WebPushService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushController {

    private final WebPushService webPushService;

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
        return webPushService.sendTest(SecurityUtils.getCurrentUserUid());
    }
}
