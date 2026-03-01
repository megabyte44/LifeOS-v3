package com.lifos.backend.repository;

import com.lifos.backend.entity.SystemSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface SystemSettingsRepository extends JpaRepository<SystemSettings, UUID> {}
