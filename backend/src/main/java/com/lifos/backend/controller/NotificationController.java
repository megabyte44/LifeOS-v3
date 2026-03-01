package com.lifos.backend.controller;

import com.lifos.backend.dto.*;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAll() {
        return ResponseEntity.ok(notificationService.getAll(SecurityUtils.getCurrentUserUid()));
    }

    @PostMapping
    public ResponseEntity<NotificationResponse> create(@RequestBody CreateNotificationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(notificationService.create(SecurityUtils.getCurrentUserUid(), req));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<NotificationResponse> markRead(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.markRead(SecurityUtils.getCurrentUserUid(), id));
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead() {
        notificationService.markAllRead(SecurityUtils.getCurrentUserUid());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        notificationService.delete(SecurityUtils.getCurrentUserUid(), id);
        return ResponseEntity.noContent().build();
    }
}
