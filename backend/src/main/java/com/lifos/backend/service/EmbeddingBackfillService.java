package com.lifos.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.lifos.backend.entity.*;
import com.lifos.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * One-shot backfill that embeds all existing entities for every user.
 * Uses EmbeddingTextBuilder for consistent metadata across all 12 source types.
 * Safe to call multiple times — EmbeddingService deduplicates by content hash.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmbeddingBackfillService {

    private final UserRepository userRepository;
    private final NoteRepository noteRepository;
    private final GoalRepository goalRepository;
    private final TodoRepository todoRepository;
    private final HabitRepository habitRepository;
    private final TransactionRepository transactionRepository;
    private final PlannerItemRepository plannerItemRepository;
    private final UserProfileRepository userProfileRepository;
    private final WorkoutSplitRepository workoutSplitRepository;
    private final EmbeddingService embeddingService;

    @Async
    public void backfillAll() {
        List<User> users = userRepository.findAll();
        AtomicInteger total = new AtomicInteger();

        log.info("Starting universal embedding backfill for {} users", users.size());

        for (User user : users) {
            String uid = user.getUid();
            try {
                backfillNotes(uid, total);
                backfillGoals(uid, total);
                backfillTodos(uid, total);
                backfillHabits(uid, total);
                backfillTransactions(uid, total);
                backfillPlannerItems(uid, total);
                backfillUserProfile(uid, total);
                backfillWorkoutSplit(uid, total);
            } catch (Exception e) {
                log.warn("Backfill skipped for user {}: {}", uid, e.getMessage());
            }
        }

        log.info("Universal embedding backfill complete — {} documents processed", total.get());
    }

    private void backfillNotes(String uid, AtomicInteger total) {
        for (Note note : noteRepository.findAllByUserUidOrderByCreatedAtDesc(uid)) {
            embedSafe(uid, "note", note.getId(), buildNoteText(note), total);
        }
    }

    private void backfillGoals(String uid, AtomicInteger total) {
        for (Goal goal : goalRepository.findAllByUserUidWithChildren(uid)) {
            embedSafe(uid, "goal", goal.getId(),
                    goal.getTitle() + "\n" + goal.getDescription() + "\n" + goal.getMotive(), total);
        }
    }

    private void backfillTodos(String uid, AtomicInteger total) {
        for (TodoItem todo : todoRepository.findAllByUserUid(uid)) {
            embedSafe(uid, "todo", todo.getId(), todo.getText(), total);
        }
    }

    private void backfillHabits(String uid, AtomicInteger total) {
        for (Habit habit : habitRepository.findAllByUserUid(uid)) {
            String text = habit.getName() + (habit.getContext() != null ? " [" + habit.getContext() + "]" : "");
            embedSafe(uid, "habit", habit.getId(), text, total);
        }
    }

    private void backfillTransactions(String uid, AtomicInteger total) {
        for (Transaction tx : transactionRepository.findAllByUserUidOrderByDateDesc(uid)) {
            String text = tx.getDescription() + " [" + tx.getCategory() + "] " + tx.getAmount();
            embedSafe(uid, "transaction", tx.getId(), text, total);
        }
    }

    private void backfillPlannerItems(String uid, AtomicInteger total) {
        for (PlannerItem item : plannerItemRepository.findAllByUserUid(uid)) {
            String text = item.getTitle() + " " + item.getDay() + " " + item.getStartTime() + "-" + item.getEndTime()
                    + (item.getTag() != null ? " [" + item.getTag() + "]" : "");
            embedSafe(uid, "planner_item", item.getId(), text, total);
        }
    }

    private void backfillUserProfile(String uid, AtomicInteger total) {
        userProfileRepository.findByUserUid(uid).ifPresent(p -> {
            StringBuilder sb = new StringBuilder();
            if (p.getBio() != null && !p.getBio().isBlank()) sb.append(p.getBio()).append(" ");
            if (p.getPhilosophy() != null && !p.getPhilosophy().isBlank()) sb.append(p.getPhilosophy()).append(" ");
            if (p.getOccupation() != null && !p.getOccupation().isBlank()) sb.append(p.getOccupation()).append(" ");
            if (p.getLifeMotto() != null && !p.getLifeMotto().isBlank()) sb.append(p.getLifeMotto()).append(" ");
            if (p.getLifeSummary() != null && !p.getLifeSummary().isBlank()) sb.append(p.getLifeSummary()).append(" ");
            String text = sb.toString().trim();
            if (!text.isEmpty()) {
                embedSafe(uid, "user_profile", p.getId(), text, total);
            }
        });
    }

    private void backfillWorkoutSplit(String uid, AtomicInteger total) {
        workoutSplitRepository.findByUserUid(uid).ifPresent(ws -> {
            Map<String, Object> split = ws.getSplit();
            if (split != null && !split.isEmpty()) {
                StringBuilder sb = new StringBuilder("Workout Split: ");
                split.forEach((day, val) -> sb.append(day).append(": ").append(val).append("; "));
                embedSafe(uid, "workout_split", ws.getId(), sb.toString(), total);
            }
        });
    }

    private void embedSafe(String uid, String sourceType, java.util.UUID sourceId, String text, AtomicInteger total) {
        try {
            EmbeddingTextBuilder.EmbeddingMeta meta = EmbeddingTextBuilder.metaFor(sourceType);
            embeddingService.embedAndStore(uid, sourceType, sourceId, text,
                    meta.domain(), meta.domainTag(), meta.quality(), meta.recency(), meta.importance());
            total.incrementAndGet();
        } catch (Exception e) {
            log.warn("Backfill failed for {} {} user {}: {}", sourceType, sourceId, uid, e.getMessage());
        }
    }

    private String buildNoteText(Note note) {
        String content = "";
        JsonNode c = note.getContent();
        if (c != null) {
            content = c.isTextual() ? c.asText()
                    : c.has("text") ? c.get("text").asText("")
                    : c.toString();
        }
        return note.getTitle() + "\n" + content;
    }
}
