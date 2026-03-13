package com.lifos.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Public health endpoint — no authentication required.
 *
 * GET /health
 *   → 200 { status: "UP",   db: "UP",   timestamp: "..." }
 *   → 200 { status: "DEGRADED", db: "DOWN", timestamp: "..." }
 *
 * Lives outside /api/** so it is permitted without a Firebase token.
 * Used by the frontend connection logger to track backend + DB reachability.
 */
@RestController
@RequestMapping("/health")
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;

    @GetMapping
    public ResponseEntity<Map<String, String>> health() {
        String dbStatus = checkDatabase();

        Map<String, String> body = new LinkedHashMap<>();
        body.put("status",    dbStatus.equals("UP") ? "UP" : "DEGRADED");
        body.put("db",        dbStatus);
        body.put("timestamp", Instant.now().toString());

        return ResponseEntity.ok(body);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String checkDatabase() {
        try (Connection conn = dataSource.getConnection()) {
            boolean valid = conn.isValid(2); // 2-second timeout
            return valid ? "UP" : "DOWN";
        } catch (Exception e) {
            return "DOWN";
        }
    }
}
