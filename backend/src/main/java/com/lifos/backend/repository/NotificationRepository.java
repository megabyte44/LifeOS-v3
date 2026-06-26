package com.lifos.backend.repository;

import com.lifos.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findAllByUserUidOrderByCreatedAtDesc(String userUid);
    Optional<Notification> findByIdAndUserUid(UUID id, String userUid);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.uid = :userUid")
    void markAllReadByUserUid(String userUid);
}
