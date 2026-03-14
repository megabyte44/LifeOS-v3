package com.lifos.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lifos.backend.dto.UpdateUserProfileRequest;
import com.lifos.backend.dto.UserProfileDetailResponse;
import com.lifos.backend.entity.*;
import com.lifos.backend.event.KnowledgeGraphTriggerEvent;
import com.lifos.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final NoteRepository noteRepository;
    private final GoalRepository goalRepository;
    private final HabitRepository habitRepository;
    private final ConversationMemoryRepository conversationMemoryRepository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    // ── CRUD ────────────────────────────────────────────────────────

    @Transactional
    public UserProfile getOrCreate(String userUid) {
        return userProfileRepository.findByUserUid(userUid).orElseGet(() -> {
            User user = userRepository.findById(userUid)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userUid));
            return userProfileRepository.save(UserProfile.builder()
                    .user(user)
                    .interests(objectMapper.createArrayNode())
                    .enrichmentSources(objectMapper.createObjectNode())
                    .pendingQuestions(objectMapper.createArrayNode())
                    .build());
        });
    }

    public UserProfileDetailResponse getProfile(String userUid) {
        UserProfile p = getOrCreate(userUid);
        return toResponse(p, userUid);
    }

    @Transactional
    public UserProfileDetailResponse updateProfile(String userUid, UpdateUserProfileRequest req) {
        UserProfile p = getOrCreate(userUid);
        if (req.getAge() != null) p.setAge(req.getAge());
        if (req.getBio() != null) p.setBio(req.getBio());
        if (req.getPhilosophy() != null) p.setPhilosophy(req.getPhilosophy());
        if (req.getInterests() != null) p.setInterests(req.getInterests());
        if (req.getOccupation() != null) p.setOccupation(req.getOccupation());
        if (req.getTimezone() != null) p.setTimezone(req.getTimezone());
        if (req.getLifeMotto() != null) p.setLifeMotto(req.getLifeMotto());
        if (req.getSleepTargetHours() != null) p.setSleepTargetHours(req.getSleepTargetHours());
        if (req.getDailyCalorieTarget() != null) p.setDailyCalorieTarget(req.getDailyCalorieTarget());
        if (req.getProteinTargetOverride() != null) p.setProteinTargetOverride(req.getProteinTargetOverride());
        UserProfile saved = userProfileRepository.save(p);
        publishProfileEmbedding(userUid, saved);
        return toResponse(saved, userUid);
    }

    // ── Profile snapshot for AI context injection ───────────────────

    /**
     * Builds a natural-language profile block for prompt injection.
     * Returns empty string if the profile has no meaningful data yet.
     */
    public String buildProfileContext(String userUid) {
        Optional<UserProfile> opt = userProfileRepository.findByUserUid(userUid);
        if (opt.isEmpty()) return "";

        UserProfile p = opt.get();
        StringBuilder sb = new StringBuilder();

        appendIfPresent(sb, "Name", userRepository.findById(userUid)
                .map(User::getDisplayName).orElse(null));
        appendIfPresent(sb, "Age", p.getAge() != null ? p.getAge().toString() : null);
        appendIfPresent(sb, "Occupation", p.getOccupation());
        appendIfPresent(sb, "Bio", p.getBio());
        appendIfPresent(sb, "Philosophy", p.getPhilosophy());
        appendIfPresent(sb, "Life motto", p.getLifeMotto());
        appendIfPresent(sb, "Summary", p.getLifeSummary());

        if (p.getInterests() != null && p.getInterests().isArray() && !p.getInterests().isEmpty()) {
            List<String> items = new ArrayList<>();
            p.getInterests().forEach(n -> items.add(n.asText()));
            sb.append("Interests: ").append(String.join(", ", items)).append("\n");
        }

        return sb.toString().isBlank() ? "" : sb.toString();
    }

    // ── Enrichment: gather raw data for LLM extraction ──────────────

    /**
     * Collects raw material from LifeOS sources that the LLM can use
     * to extract / update bio, philosophy, and interests.
     */
    public String gatherEnrichmentContext(String userUid) {
        StringBuilder ctx = new StringBuilder();

        // 1. Active conversation memories
        List<ConversationMemory> memories = conversationMemoryRepository
                .findByUserUidAndActiveTrueOrderByCreatedAtDesc(userUid, PageRequest.of(0, 30));
        if (!memories.isEmpty()) {
            ctx.append("=== THINGS THE USER HAS SAID ===\n");
            for (ConversationMemory m : memories) {
                ctx.append("- ").append(m.getMemoryText()).append("\n");
            }
            ctx.append("\n");
        }

        // 2. Notes (titles + first 200 chars of content)
        List<Note> notes = noteRepository.findAllByUserUidOrderByCreatedAtDesc(userUid);
        if (!notes.isEmpty()) {
            ctx.append("=== USER'S NOTES (recent 20) ===\n");
            int count = 0;
            for (Note n : notes) {
                if (count++ >= 20) break;
                ctx.append("- [").append(n.getType()).append("] ").append(n.getTitle());
                String preview = extractTextPreview(n.getContent(), 200);
                if (!preview.isBlank()) {
                    ctx.append(": ").append(preview);
                }
                ctx.append("\n");
            }
            ctx.append("\n");
        }

        // 3. Goals
        List<Goal> goals = goalRepository.findAllByUserUidWithChildren(userUid);
        if (!goals.isEmpty()) {
            ctx.append("=== USER'S GOALS ===\n");
            for (Goal g : goals) {
                ctx.append("- ").append(g.getTitle());
                if (g.getCategory() != null) ctx.append(" [").append(g.getCategory()).append("]");
                if (g.getMotive() != null) ctx.append(" — motive: ").append(g.getMotive());
                ctx.append("\n");
            }
            ctx.append("\n");
        }

        // 4. Habits
        List<Habit> habits = habitRepository.findAllByUserUid(userUid);
        if (!habits.isEmpty()) {
            ctx.append("=== USER'S HABITS ===\n");
            for (Habit h : habits) {
                ctx.append("- ").append(h.getName());
                if (h.getContext() != null) ctx.append(" [").append(h.getContext()).append("]");
                ctx.append("\n");
            }
            ctx.append("\n");
        }

        return ctx.toString();
    }

    // ── Enrichment: apply LLM-extracted fields ──────────────────────

    /**
     * Called after the LLM extracts profile fields from gathered context.
     * Merges new data into the profile without overwriting user-set fields.
     */
    @Transactional
    public void applyEnrichment(String userUid, String bio, String philosophy,
                                List<String> interests, String lifeSummary,
                                String source) {
        UserProfile p = getOrCreate(userUid);

        if (bio != null && !bio.isBlank()) p.setBio(bio);
        if (philosophy != null && !philosophy.isBlank()) p.setPhilosophy(philosophy);
        if (lifeSummary != null && !lifeSummary.isBlank()) p.setLifeSummary(lifeSummary);

        if (interests != null && !interests.isEmpty()) {
            ArrayNode arr = objectMapper.createArrayNode();
            // Merge with existing
            Set<String> combined = new LinkedHashSet<>();
            if (p.getInterests() != null && p.getInterests().isArray()) {
                p.getInterests().forEach(n -> combined.add(n.asText().toLowerCase()));
            }
            interests.forEach(i -> combined.add(i.toLowerCase()));
            combined.forEach(arr::add);
            p.setInterests(arr);
        }

        // Update tracking
        p.setLastEnrichedAt(Instant.now());
        p.setProfileCompleteness(calculateCompleteness(p));

        ObjectNode sources = p.getEnrichmentSources() != null && p.getEnrichmentSources().isObject()
                ? (ObjectNode) p.getEnrichmentSources()
                : objectMapper.createObjectNode();
        int prev = sources.has(source) ? sources.get(source).asInt() : 0;
        sources.put(source, prev + 1);
        p.setEnrichmentSources(sources);

        userProfileRepository.save(p);
        publishProfileEmbedding(userUid, p);
        log.info("Profile enriched for user={} from source={}, completeness={}%",
                userUid, source, p.getProfileCompleteness());
    }

    // ── Chat Buddy: pending questions ───────────────────────────────

    /**
     * Returns questions the Chat Buddy should ask next, based on empty profile fields.
     */
    public List<String> generatePendingQuestions(String userUid) {
        UserProfile p = getOrCreate(userUid);
        List<String> questions = new ArrayList<>();

        if (isBlank(p.getOccupation())) questions.add("What do you do for work or study?");
        if (p.getAge() == null) questions.add("How old are you?");
        if (isBlank(p.getBio())) questions.add("Tell me a bit about yourself — where are you from, what's your story?");
        if (isBlank(p.getPhilosophy())) questions.add("What's your life philosophy or the principles you live by?");
        if (p.getInterests() == null || !p.getInterests().isArray() || p.getInterests().isEmpty()) {
            questions.add("What are your main interests and hobbies?");
        }
        if (isBlank(p.getLifeMotto())) questions.add("Do you have a life motto or a quote you live by?");
        if (isBlank(p.getLifeSummary())) questions.add("What are the most important things happening in your life right now?");

        // Store the pending questions
        ArrayNode arr = objectMapper.createArrayNode();
        questions.forEach(arr::add);
        p.setPendingQuestions(arr);
        userProfileRepository.save(p);

        return questions;
    }

    // ── Helpers ─────────────────────────────────────────────────────

    private int calculateCompleteness(UserProfile p) {
        int filled = 0;
        int total = 7;
        if (!isBlank(p.getBio())) filled++;
        if (!isBlank(p.getPhilosophy())) filled++;
        if (p.getInterests() != null && p.getInterests().isArray() && !p.getInterests().isEmpty()) filled++;
        if (!isBlank(p.getOccupation())) filled++;
        if (p.getAge() != null) filled++;
        if (!isBlank(p.getLifeMotto())) filled++;
        if (!isBlank(p.getLifeSummary())) filled++;
        return (int) Math.round((double) filled / total * 100);
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private void publishProfileEmbedding(String userUid, UserProfile p) {
        StringBuilder sb = new StringBuilder();
        if (!isBlank(p.getBio())) sb.append(p.getBio()).append(" ");
        if (!isBlank(p.getPhilosophy())) sb.append(p.getPhilosophy()).append(" ");
        if (!isBlank(p.getOccupation())) sb.append(p.getOccupation()).append(" ");
        if (!isBlank(p.getLifeMotto())) sb.append(p.getLifeMotto()).append(" ");
        if (!isBlank(p.getLifeSummary())) sb.append(p.getLifeSummary()).append(" ");
        if (p.getInterests() != null && p.getInterests().isArray()) {
            List<String> items = new ArrayList<>();
            p.getInterests().forEach(n -> items.add(n.asText()));
            sb.append("Interests: ").append(String.join(", ", items));
        }
        String text = sb.toString().trim();
        if (!text.isEmpty()) {
            eventPublisher.publishEvent(EmbeddingTextBuilder.buildEvent(
                    userUid, "user_profile", p.getId(), text));
            eventPublisher.publishEvent(new KnowledgeGraphTriggerEvent(
                    userUid, "user_profile", p.getId(), text));
        }
    }

    private void appendIfPresent(StringBuilder sb, String label, String value) {
        if (value != null && !value.isBlank()) {
            sb.append(label).append(": ").append(value).append("\n");
        }
    }

    private String extractTextPreview(JsonNode content, int maxLen) {
        if (content == null) return "";
        String text = content.isTextual() ? content.asText()
                : content.has("text") ? content.get("text").asText("")
                : content.toString();
        return text.length() > maxLen ? text.substring(0, maxLen) + "…" : text;
    }

    private UserProfileDetailResponse toResponse(UserProfile p, String userUid) {
        return UserProfileDetailResponse.builder()
                .uid(userUid)
                .age(p.getAge())
                .bio(p.getBio())
                .philosophy(p.getPhilosophy())
                .interests(p.getInterests())
                .occupation(p.getOccupation())
                .timezone(p.getTimezone())
                .lifeMotto(p.getLifeMotto())
                .lifeSummary(p.getLifeSummary())
                .sleepTargetHours(p.getSleepTargetHours())
                .dailyCalorieTarget(p.getDailyCalorieTarget())
                .proteinTargetOverride(p.getProteinTargetOverride())
                .profileCompleteness(p.getProfileCompleteness())
                .pendingQuestions(p.getPendingQuestions())
                .enrichmentSources(p.getEnrichmentSources())
                .lastEnrichedAt(p.getLastEnrichedAt() != null ? p.getLastEnrichedAt().toString() : null)
                .createdAt(p.getCreatedAt().toString())
                .updatedAt(p.getUpdatedAt().toString())
                .build();
    }
}
