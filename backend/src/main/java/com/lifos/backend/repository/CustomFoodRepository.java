package com.lifos.backend.repository;

import com.lifos.backend.entity.CustomFood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomFoodRepository extends JpaRepository<CustomFood, UUID> {
    Optional<CustomFood> findByUserUid(String userUid);
}
