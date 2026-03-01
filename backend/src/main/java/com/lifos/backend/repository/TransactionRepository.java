package com.lifos.backend.repository;

import com.lifos.backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findAllByUserUidOrderByDateDesc(String userUid);
    Optional<Transaction> findByIdAndUserUid(UUID id, String userUid);
    long countByUserUid(String userUid);
}
