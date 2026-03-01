package com.lifos.backend.repository;

import com.lifos.backend.entity.AiConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface AiConfigurationRepository extends JpaRepository<AiConfiguration, UUID> {}
