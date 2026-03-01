package com.lifos.backend.repository;

import com.lifos.backend.entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, UUID> {

    List<PushSubscription> findAllByUserUid(String userUid);

    Optional<PushSubscription> findByEndpoint(String endpoint);

    @Modifying
    @Query("DELETE FROM PushSubscription p WHERE p.endpoint = :endpoint AND p.userUid = :userUid")
    int deleteByEndpointAndUserUid(String endpoint, String userUid);
}
