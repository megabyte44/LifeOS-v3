package com.lifos.backend.repository;

import com.lifos.backend.entity.Credential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CredentialRepository extends JpaRepository<Credential, UUID> {
    List<Credential> findAllByUserUid(String userUid);
    Optional<Credential> findByIdAndUserUid(UUID id, String userUid);
}
