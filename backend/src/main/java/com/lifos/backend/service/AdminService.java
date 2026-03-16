package com.lifos.backend.service;

import com.lifos.backend.dto.*;
import com.lifos.backend.entity.*;
import com.lifos.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepo;
    private final NoteRepository noteRepo;
    private final TodoRepository todoRepo;
    private final HabitRepository habitRepo;
    private final TransactionRepository transactionRepo;
    private final AiChatHistoryRepository aiChatHistoryRepo;
    private final AiConfigurationRepository aiConfigRepo;
    private final AiConfigurationResolver aiConfigurationResolver;
    private final SystemSettingsRepository systemSettingsRepo;
    private final AnnouncementRepository announcementRepo;
    private final AboutPageRepository aboutPageRepo;

    // ── Admin Check ───────────────────────────────────────────────────────────

    public boolean isAdmin(String uid) {
        return userRepo.findById(uid)
                .map(u -> "admin".equalsIgnoreCase(u.getRole()))
                .orElse(false);
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<UserStatsResponse> getUsers() {
        DateTimeFormatter fmt = DateTimeFormatter.ISO_INSTANT.withZone(ZoneId.of("UTC"));
        return userRepo.findAll().stream().map(u -> {
            UserStatsResponse r = new UserStatsResponse();
            r.setUid(u.getUid());
            r.setEmail(u.getEmail());
            r.setDisplayName(u.getDisplayName());
            r.setCreatedAt(fmt.format(u.getCreatedAt()));
            r.setLastLoginAt(fmt.format(u.getCreatedAt())); // use createdAt as proxy
            r.setNotesCount(noteRepo.countByUserUid(u.getUid()));
            r.setTodosCount(todoRepo.countByUserUid(u.getUid()));
            r.setHabitsCount(habitRepo.countByUserUid(u.getUid()));
            r.setTransactionsCount(transactionRepo.countByUserUid(u.getUid()));
            r.setAiMessagesCount(aiChatHistoryRepo.countByUserUid(u.getUid()));
            r.setRole(u.getRole());
            return r;
        }).collect(Collectors.toList());
    }

    // ── AI Config ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AiConfigurationResponse getAiConfig() {
        AiConfiguration row = aiConfigurationResolver.resolve();
        return toAiConfigResponse(row);
    }

    @Transactional
    public AiConfigurationResponse updateAiConfig(String uid, UpdateAiConfigRequest req) {
        log.info("Admin [{}] updating AI configuration", uid);
        AiConfiguration row = aiConfigRepo.findAll().stream().findFirst()
            .orElse(aiConfigurationResolver.resolve());
        if (req.getSystemInstructions() != null) row.setSystemInstructions(req.getSystemInstructions());
        if (req.getDefaultPersonality() != null) row.setDefaultPersonality(req.getDefaultPersonality());
        if (req.getModelConfig() != null) row.setModelConfig(req.getModelConfig());
        if (req.getApiKeys() != null) row.setApiKeys(req.getApiKeys());
        if (req.getRagEnabled() != null) row.setRagEnabled(req.getRagEnabled());
        if (req.getInsightsEnabled() != null) row.setInsightsEnabled(req.getInsightsEnabled());
        if (req.getInsightsCron() != null) row.setInsightsCron(req.getInsightsCron());
        if (req.getEvaluationEnabled() != null) row.setEvaluationEnabled(req.getEvaluationEnabled());
        if (req.getEvaluationSampleRate() != null) row.setEvaluationSampleRate(req.getEvaluationSampleRate());
        row.setUpdatedBy(uid);
        return toAiConfigResponse(aiConfigRepo.save(row));
    }

    // ── System Settings ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SystemSettingsResponse getSystemSettings() {
        SystemSettings row = systemSettingsRepo.findAll().stream().findFirst()
                .orElse(SystemSettings.builder().build());
        return toSettingsResponse(row);
    }

    @Transactional
    public SystemSettingsResponse updateSystemSettings(String uid, UpdateSystemSettingsRequest req) {
        log.info("Admin [{}] updating system settings", uid);
        SystemSettings row = systemSettingsRepo.findAll().stream().findFirst()
                .orElse(SystemSettings.builder().build());
        if (req.getFeatures() != null) row.setFeatures(req.getFeatures());
        if (req.getMaintenance() != null) row.setMaintenance(req.getMaintenance());
        if (req.getLimits() != null) row.setLimits(req.getLimits());
        row.setUpdatedBy(uid);
        return toSettingsResponse(systemSettingsRepo.save(row));
    }

    // ── Announcements ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAnnouncements() {
        return announcementRepo.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toAnnouncementResponse).collect(Collectors.toList());
    }

    @Transactional
    public AnnouncementResponse createAnnouncement(String uid, CreateAnnouncementRequest req) {
        log.info("Admin [{}] creating announcement: '{}'", uid, req.getTitle());
        Announcement a = Announcement.builder()
                .title(req.getTitle())
                .content(req.getContent() != null ? req.getContent() : "")
                .type(req.getType() != null ? req.getType() : "info")
                .version(req.getVersion())
                .published(req.getPublished() != null ? req.getPublished() : false)
                .createdBy(uid)
                .build();
        if (Boolean.TRUE.equals(a.getPublished())) {
            a.setPublishedAt(java.time.Instant.now());
        }
        return toAnnouncementResponse(announcementRepo.save(a));
    }

    @Transactional
    public AnnouncementResponse updateAnnouncement(UUID id, CreateAnnouncementRequest req) {
        Announcement a = announcementRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found"));
        if (req.getTitle() != null) a.setTitle(req.getTitle());
        if (req.getContent() != null) a.setContent(req.getContent());
        if (req.getType() != null) a.setType(req.getType());
        if (req.getVersion() != null) a.setVersion(req.getVersion());
        if (req.getPublished() != null) {
            a.setPublished(req.getPublished());
            if (req.getPublished() && a.getPublishedAt() == null) {
                a.setPublishedAt(java.time.Instant.now());
            }
        }
        return toAnnouncementResponse(announcementRepo.save(a));
    }

    @Transactional
    public void deleteAnnouncement(UUID id) {
        Announcement a = announcementRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found"));
        log.info("Deleting announcement [{}]: '{}'", id, a.getTitle());
        announcementRepo.delete(a);
    }

    // ── About Page ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AboutPageResponse getAbout() {
        AboutPage row = aboutPageRepo.findAll().stream().findFirst()
                .orElse(AboutPage.builder().build());
        return toAboutResponse(row);
    }

    @Transactional
    public AboutPageResponse updateAbout(String uid, UpdateAboutPageRequest req) {
        log.info("Admin [{}] updating about page", uid);
        AboutPage row = aboutPageRepo.findAll().stream().findFirst()
                .orElse(AboutPage.builder().build());
        if (req.getTitle() != null) row.setTitle(req.getTitle());
        if (req.getDescription() != null) row.setDescription(req.getDescription());
        if (req.getVersion() != null) row.setVersion(req.getVersion());
        if (req.getMarkdownContent() != null) row.setMarkdownContent(req.getMarkdownContent());
        if (req.getFeatures() != null) row.setFeatures(req.getFeatures());
        if (req.getContact() != null) row.setContact(req.getContact());
        row.setUpdatedBy(uid);
        return toAboutResponse(aboutPageRepo.save(row));
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AdminDashboardStatsResponse getDashboardStats() {
        AdminDashboardStatsResponse r = new AdminDashboardStatsResponse();
        r.setTotalUsers(userRepo.count());
        r.setTotalAiMessages(aiChatHistoryRepo.count());
        return r;
    }

    // ── Analytics ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics(int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);

        List<DailyMessageCount> daily = aiChatHistoryRepo.countMessagesByDay(since)
            .stream()
            .map(row -> new DailyMessageCount(row[0].toString(), ((Number) row[1]).longValue()))
            .collect(Collectors.toList());

        List<UserMessageCount> topUsers = aiChatHistoryRepo.countMessagesByUser(since)
            .stream()
            .map(row -> new UserMessageCount(
                row[0].toString(),
                row[1].toString(),
                row[2] != null ? row[2].toString() : null,
                ((Number) row[3]).longValue()))
            .collect(Collectors.toList());

        long total = daily.stream().mapToLong(DailyMessageCount::getCount).sum();
        double avg = days > 0 ? (double) total / days : 0.0;

        AnalyticsResponse res = new AnalyticsResponse();
        res.setDailyMessages(daily);
        res.setTopUsers(topUsers);
        res.setTotalMessages(total);
        res.setAvgPerDay(avg);
        return res;
    }

    // ── User Role Management ───────────────────────────────────────────────────

    @Transactional
    public void updateUserRole(String uid, String role) {
        if (!List.of("user", "admin").contains(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role: " + role);
        }
        User u = userRepo.findById(uid)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        log.info("Admin updating role for user [{}] to '{}'", uid, role);
        u.setRole(role);
        userRepo.save(u);
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private AiConfigurationResponse toAiConfigResponse(AiConfiguration c) {
        AiConfigurationResponse r = new AiConfigurationResponse();
        r.setId(c.getId());
        r.setSystemInstructions(c.getSystemInstructions());
        r.setDefaultPersonality(c.getDefaultPersonality());
        r.setModelConfig(c.getModelConfig());
        r.setApiKeys(c.getApiKeys());
        r.setRagEnabled(c.getRagEnabled());
        r.setInsightsEnabled(c.getInsightsEnabled());
        r.setInsightsCron(c.getInsightsCron());
        r.setEvaluationEnabled(c.getEvaluationEnabled());
        r.setEvaluationSampleRate(c.getEvaluationSampleRate());
        r.setUpdatedAt(c.getUpdatedAt());
        r.setUpdatedBy(c.getUpdatedBy());
        return r;
    }

    private SystemSettingsResponse toSettingsResponse(SystemSettings s) {
        SystemSettingsResponse r = new SystemSettingsResponse();
        r.setId(s.getId());
        r.setFeatures(s.getFeatures());
        r.setMaintenance(s.getMaintenance());
        r.setLimits(s.getLimits());
        r.setUpdatedAt(s.getUpdatedAt());
        r.setUpdatedBy(s.getUpdatedBy());
        return r;
    }

    private AnnouncementResponse toAnnouncementResponse(Announcement a) {
        AnnouncementResponse r = new AnnouncementResponse();
        r.setId(a.getId());
        r.setTitle(a.getTitle());
        r.setContent(a.getContent());
        r.setType(a.getType());
        r.setVersion(a.getVersion());
        r.setPublished(a.getPublished());
        r.setPublishedAt(a.getPublishedAt());
        r.setCreatedAt(a.getCreatedAt());
        r.setCreatedBy(a.getCreatedBy());
        return r;
    }

    private AboutPageResponse toAboutResponse(AboutPage p) {
        AboutPageResponse r = new AboutPageResponse();
        r.setId(p.getId());
        r.setTitle(p.getTitle());
        r.setDescription(p.getDescription());
        r.setVersion(p.getVersion());
        r.setMarkdownContent(p.getMarkdownContent());
        r.setFeatures(p.getFeatures());
        r.setContact(p.getContact());
        r.setUpdatedAt(p.getUpdatedAt());
        r.setUpdatedBy(p.getUpdatedBy());
        return r;
    }
}
