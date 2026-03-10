package com.lifos.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.lifos.backend.entity.ActivityLog;
import com.lifos.backend.entity.User;
import com.lifos.backend.repository.ActivityLogRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void log(String userUid, String feature, String action, UUID entityId,
                    String summary, JsonNode metadata) {
        User user = userRepository.findById(userUid).orElse(null);
        if (user == null) {
            log.warn("ActivityLog: user {} not found, skipping log entry", userUid);
            return;
        }
        ActivityLog entry = ActivityLog.builder()
                .user(user)
                .feature(feature)
                .action(action)
                .entityId(entityId)
                .summary(summary)
                .metadata(metadata)
                .build();
        activityLogRepository.save(entry);
        log.debug("Activity logged: [{}/{}] {}", feature, action, summary);
    }

    @Transactional
    public void log(String userUid, String feature, String action, UUID entityId, String summary) {
        log(userUid, feature, action, entityId, summary, null);
    }

    public List<ActivityLog> getRecent(String userUid, int limit) {
        return activityLogRepository.findByUserUidOrderByCreatedAtDesc(
                userUid, PageRequest.of(0, limit));
    }
}
