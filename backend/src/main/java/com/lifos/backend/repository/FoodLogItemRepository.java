package com.lifos.backend.repository;

import com.lifos.backend.entity.FoodLogItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FoodLogItemRepository extends JpaRepository<FoodLogItem, UUID> {
    List<FoodLogItem> findAllByUserUid(String userUid);
    Optional<FoodLogItem> findByIdAndUserUid(UUID id, String userUid);
}
