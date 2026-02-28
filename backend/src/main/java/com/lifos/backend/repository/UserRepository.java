package com.lifos.backend.repository;

import com.lifos.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for User entity.
 *
 * KEY CONCEPT:
 * - Just by extending JpaRepository<User, String>, Spring auto-generates:
 *     findById(id), findAll(), save(entity), deleteById(id), existsById(id), etc.
 * - The second generic parameter (String) is the type of the primary key.
 * - You can add custom query methods just by naming them correctly:
 *     findByEmail(String email) → Spring generates: SELECT * FROM users WHERE email = ?
 */
@Repository
public interface UserRepository extends JpaRepository<User, String> {

    // Spring Data JPA auto-implements this based on the method name!
    boolean existsByEmail(String email);
}
