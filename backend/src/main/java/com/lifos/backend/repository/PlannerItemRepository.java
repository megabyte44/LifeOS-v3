package com.lifos.backend.repository;

import com.lifos.backend.entity.PlannerItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlannerItemRepository extends JpaRepository<PlannerItem, UUID> {

    List<PlannerItem> findAllByUserUid(String userUid);

    List<PlannerItem> findAllByUserUidAndDay(String userUid, String day);

    @Modifying
    @Query("DELETE FROM PlannerItem p WHERE p.user.uid = :userUid AND p.day = :day")
    void deleteAllByUserUidAndDay(String userUid, String day);

    Optional<PlannerItem> findByIdAndUserUid(UUID id, String userUid);
}
