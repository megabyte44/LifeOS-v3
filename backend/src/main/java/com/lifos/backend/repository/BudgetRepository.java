package com.lifos.backend.repository;

import com.lifos.backend.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, UUID> {
    Optional<Budget> findByUserUid(String userUid);
}
