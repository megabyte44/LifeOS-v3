package com.lifos.backend.controller;

import com.lifos.backend.dto.*;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.AdminService;
import com.lifos.backend.service.EmbeddingBackfillService;
import com.lifos.backend.service.InsightGeneratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final EmbeddingBackfillService embeddingBackfillService;
    private final InsightGeneratorService insightGeneratorService;

    /** GET /api/admin/check — anyone authenticated can query this */
    @GetMapping("/check")
    public Map<String, Boolean> checkAdmin() {
        return Map.of("isAdmin", adminService.isAdmin(SecurityUtils.getCurrentUserUid()));
    }

    /** GET /api/admin/users */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserStatsResponse> getUsers() {
        return adminService.getUsers();
    }

    // ── AI Config ─────────────────────────────────────────────────────────────

    @GetMapping("/ai-config")
    @PreAuthorize("hasRole('ADMIN')")
    public AiConfigurationResponse getAiConfig() {
        return adminService.getAiConfig();
    }

    @PutMapping("/ai-config")
    @PreAuthorize("hasRole('ADMIN')")
    public AiConfigurationResponse updateAiConfig(@RequestBody UpdateAiConfigRequest req) {
        return adminService.updateAiConfig(SecurityUtils.getCurrentUserUid(), req);
    }

    // ── System Settings ───────────────────────────────────────────────────────

    @GetMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    public SystemSettingsResponse getSystemSettings() {
        return adminService.getSystemSettings();
    }

    @PutMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    public SystemSettingsResponse updateSystemSettings(@RequestBody UpdateSystemSettingsRequest req) {
        return adminService.updateSystemSettings(SecurityUtils.getCurrentUserUid(), req);
    }

    // ── Announcements ─────────────────────────────────────────────────────────

    @GetMapping("/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AnnouncementResponse> getAnnouncements() {
        return adminService.getAnnouncements();
    }

    @PostMapping("/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public AnnouncementResponse createAnnouncement(@RequestBody CreateAnnouncementRequest req) {
        return adminService.createAnnouncement(SecurityUtils.getCurrentUserUid(), req);
    }

    @PutMapping("/announcements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AnnouncementResponse updateAnnouncement(@PathVariable UUID id,
                                                   @RequestBody CreateAnnouncementRequest req) {
        return adminService.updateAnnouncement(id, req);
    }

    @DeleteMapping("/announcements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAnnouncement(@PathVariable UUID id) {
        adminService.deleteAnnouncement(id);
    }

    // ── About Page ────────────────────────────────────────────────────────────

    @GetMapping("/about")
    @PreAuthorize("hasRole('ADMIN')")
    public AboutPageResponse getAbout() {
        return adminService.getAbout();
    }

    @PutMapping("/about")
    @PreAuthorize("hasRole('ADMIN')")
    public AboutPageResponse updateAbout(@RequestBody UpdateAboutPageRequest req) {
        return adminService.updateAbout(SecurityUtils.getCurrentUserUid(), req);
    }

    // ── Embedding Backfill ────────────────────────────────────────────────────

    /**
     * POST /api/admin/backfill-embeddings
     * Queues async re-embedding of all notes and goals for every user.
     * Safe to call multiple times — deduplicates by content hash.
     */
    @PostMapping("/backfill-embeddings")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> backfillEmbeddings() {
        embeddingBackfillService.backfillAll();
        return Map.of("status", "queued", "message", "Backfill started in background");
    }

    // ── Proactive Insights ────────────────────────────────────────────────────

    /**
     * POST /api/admin/trigger-insights
     * Manually fires the insight job for the calling user.
     * Useful for testing without waiting for the daily scheduled run.
     */
    @PostMapping("/trigger-insights")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> triggerInsights() {
        insightGeneratorService.triggerForUser(SecurityUtils.getCurrentUserUid());
        return Map.of("status", "triggered", "message", "Insight generation started for your account");
    }
}
