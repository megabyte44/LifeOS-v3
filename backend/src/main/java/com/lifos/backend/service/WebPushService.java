package com.lifos.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifos.backend.dto.PushSubscribeRequest;
import com.lifos.backend.dto.PushMessagePayload;
import com.lifos.backend.entity.PushSubscription;
import com.lifos.backend.repository.PushSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebPushService {

    private final PushSubscriptionRepository subscriptionRepo;
    private final ObjectMapper objectMapper;

    @Value("${vapid.public-key:}")
    private String vapidPublicKey;

    @Value("${vapid.private-key:}")
    private String vapidPrivateKey;

    @Value("${vapid.subject:mailto:admin@lifeos.app}")
    private String vapidSubject;

    // ── Subscribe ─────────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> subscribe(String uid, PushSubscribeRequest req) {
        if (req.getSubscription() == null || req.getSubscription().getEndpoint() == null) {
            return Map.of("success", false, "message", "Invalid subscription object.");
        }

        // Upsert: remove old if same endpoint exists, then insert
        subscriptionRepo.findByEndpoint(req.getSubscription().getEndpoint())
                .ifPresent(subscriptionRepo::delete);

        PushSubscription sub = PushSubscription.builder()
                .userUid(uid)
                .endpoint(req.getSubscription().getEndpoint())
                .p256dh(req.getSubscription().getKeys().getP256dh())
                .auth(req.getSubscription().getKeys().getAuth())
                .build();
        subscriptionRepo.save(sub);
        return Map.of("success", true, "message", "Subscription saved.");
    }

    // ── Unsubscribe ───────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> unsubscribe(String uid, String endpoint) {
        int deleted = subscriptionRepo.deleteByEndpointAndUserUid(endpoint, uid);
        return Map.of("success", deleted > 0, "message", deleted > 0 ? "Unsubscribed." : "Subscription not found.");
    }

    // ── Send Test ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public int sendToUser(String uid, PushMessagePayload payload) {
        if (vapidPublicKey.isBlank() || vapidPrivateKey.isBlank()) {
            log.warn("Skipping push delivery because VAPID keys are not configured.");
            return 0;
        }

        List<PushSubscription> subs = subscriptionRepo.findAllByUserUid(uid);
        if (subs.isEmpty()) {
            return 0;
        }

        String serializedPayload = serializePayload(payload);
        int sent = 0;

        try {
            PushService pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
            for (PushSubscription sub : subs) {
                try {
                    Notification notification = new Notification(sub.getEndpoint(), sub.getP256dh(), sub.getAuth(), serializedPayload);
                    pushService.send(notification);
                    sent++;
                } catch (Exception e) {
                    log.warn("Failed to send push to endpoint {}: {}", sub.getEndpoint(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Push service init error: {}", e.getMessage());
            return 0;
        }

        return sent;
    }

    private String serializePayload(PushMessagePayload payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to serialize push payload", e);
        }
    }
}
