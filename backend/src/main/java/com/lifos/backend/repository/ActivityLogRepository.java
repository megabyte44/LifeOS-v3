package com.lifos.backend.repository;

import com.lifos.backend.entity.ActivityLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    List<ActivityLog> findByUserUidOrderByCreatedAtDesc(String userUid, Pageable pageable);
}
