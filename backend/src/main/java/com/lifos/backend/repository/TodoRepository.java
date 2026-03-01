package com.lifos.backend.repository;

import com.lifos.backend.entity.TodoItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for TodoItem entity.
 *
 * KEY CONCEPT:
 * - findAllByUserUid(uid) → Spring parses the method name:
 *     "findAll" = SELECT *, "ByUserUid" = WHERE user_uid = ?
 * - findByIdAndUserUid(id, uid) → ensures a user can only access THEIR todos
 *   (security: prevents user A from reading/editing user B's data)
 */
@Repository
public interface TodoRepository extends JpaRepository<TodoItem, UUID> {

    /** Get all todos for a specific user */
    List<TodoItem> findAllByUserUid(String userUid);

    /** Find a specific todo only if it belongs to the given user */
    Optional<TodoItem> findByIdAndUserUid(UUID id, String userUid);

    /** Delete a todo only if it belongs to the given user */
    void deleteByIdAndUserUid(UUID id, String userUid);

    long countByUserUid(String userUid);
}
