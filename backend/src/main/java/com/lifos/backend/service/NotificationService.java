package com.lifos.backend.service;

import com.lifos.backend.dto.*;
import com.lifos.backend.entity.Notification;
import com.lifos.backend.entity.User;
import com.lifos.backend.exception.ResourceNotFoundException;
import com.lifos.backend.repository.NotificationRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private User getUser(String uid) {
        return userRepository.findById(uid)
                .orElseThrow(() -> new ResourceNotFoundException("User", "uid", uid));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId().toString())
                .title(n.getTitle())
                .date(n.getDate())
                .message(n.getMessage())
                .read(n.getRead())
                .sourceType(n.getSourceType())
                .sourceId(n.getSourceId())
                .actionUrl(n.getActionUrl())
                .createdAt(n.getCreatedAt())
                .build();
    }

    public List<NotificationResponse> getAll(String uid) {
        return notificationRepository.findAllByUserUidOrderByCreatedAtDesc(uid)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public NotificationResponse create(String uid, CreateNotificationRequest req) {
        User user = getUser(uid);
        log.info("Creating notification '{}' for user [{}]", req.getTitle(), uid);
        Notification n = Notification.builder()
                .user(user)
                .title(req.getTitle())
                .date(req.getDate())
                .message(req.getMessage())
                .read(req.getRead() != null ? req.getRead() : false)
            .sourceType(req.getSourceType())
            .sourceId(req.getSourceId())
            .actionUrl(req.getActionUrl())
                .build();
        return toResponse(notificationRepository.save(n));
    }

    @Transactional
    public NotificationResponse markRead(String uid, UUID id) {
        log.debug("Marking notification [{}] as read for user [{}]", id, uid);
        Notification n = notificationRepository.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        n.setRead(true);
        return toResponse(notificationRepository.save(n));
    }

    @Transactional
    public void markAllRead(String uid) {
        log.info("Marking all notifications as read for user [{}]", uid);
        notificationRepository.markAllReadByUserUid(uid);
    }

    @Transactional
    public void delete(String uid, UUID id) {
        Notification n = notificationRepository.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        log.info("Deleting notification [{}] for user [{}]", id, uid);
        notificationRepository.delete(n);
    }
}
