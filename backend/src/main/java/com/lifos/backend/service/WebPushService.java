package com.lifos.backend.service;

import com.lifos.backend.dto.PushSubscribeRequest;
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
    public Map<String, Object> sendTest(String uid) {
        if (vapidPublicKey.isBlank() || vapidPrivateKey.isBlank()) {
            return Map.of("success", false, "message", "VAPID keys not configured. Set vapid.public-key and vapid.private-key in application.yaml.");
        }

        List<PushSubscription> subs = subscriptionRepo.findAllByUserUid(uid);
        if (subs.isEmpty()) {
            return Map.of("success", false, "message", "No push subscriptions found for this user.");
        }

        String payload = "{\"title\":\"LifeOS\",\"body\":\"Push notifications are working!\",\"icon\":\"/icons/icon-192x192.png\"}";
        int sent = 0;

        try {
            PushService pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
            for (PushSubscription sub : subs) {
                try {
                    Notification notification = new Notification(sub.getEndpoint(), sub.getP256dh(), sub.getAuth(), payload);
                    pushService.send(notification);
                    sent++;
                } catch (Exception e) {
                    log.warn("Failed to send push to endpoint {}: {}", sub.getEndpoint(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Push service init error: {}", e.getMessage());
            return Map.of("success", false, "message", "Push service error: " + e.getMessage());
        }

        return Map.of("success", true, "message", "Test notification sent to " + sent + " subscription(s).");
    }
}
