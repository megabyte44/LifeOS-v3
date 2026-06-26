package com.lifos.backend.service;

import com.lifos.backend.entity.ActivityLog;
import com.lifos.backend.entity.Habit;
import com.lifos.backend.entity.Note;
import com.lifos.backend.entity.PlannerItem;
import com.lifos.backend.entity.TodoItem;
import com.lifos.backend.repository.ActivityLogRepository;
import com.lifos.backend.repository.HabitRepository;
import com.lifos.backend.repository.NoteRepository;
import com.lifos.backend.repository.PlannerItemRepository;
import com.lifos.backend.repository.TodoRepository;
import com.lifos.backend.repository.UserProfileRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Gathers hard facts from SQL (not vector search) for AI context injection.
 * Covers: profile, habits, schedule, notes, recent activity.
 * Target: ~2000 tokens of natural-language context.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StructuredContextService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final HabitRepository habitRepository;
    private final PlannerItemRepository plannerItemRepository;
    private final TodoRepository todoRepository;
    private final ActivityLogRepository activityLogRepository;
    private final NoteRepository noteRepository;

    /**
     * Builds a structured snapshot of the user's current state for AI context.
     */
    public String buildSnapshot(String userUid) {
        return buildSnapshot(userUid, Set.of(QueryIntentClassifier.Intent.GENERAL));
    }

    /**
     * Intent-selective snapshot: only inject structured sections matching detected intents.
     * GENERAL intent injects all sections (backward compatible).
     */
    public String buildSnapshot(String userUid, Set<QueryIntentClassifier.Intent> intents) {
        StringBuilder sb = new StringBuilder();

        boolean all = intents.contains(QueryIntentClassifier.Intent.GENERAL);

        if (all || intents.contains(QueryIntentClassifier.Intent.HABITS)) {
            appendHabitsSnapshot(sb, userUid);
        }
        if (all || intents.contains(QueryIntentClassifier.Intent.SCHEDULE)
                || intents.contains(QueryIntentClassifier.Intent.TODOS)) {
            appendScheduleSnapshot(sb, userUid);
        }
        if (all || intents.contains(QueryIntentClassifier.Intent.NOTES)) {
            appendNotesSnapshot(sb, userUid);
        }
        // JOURNAL: stub for when journal feature is implemented
        if (all) {
            appendRecentActivity(sb, userUid);
        }

        return sb.toString();
    }

    // ── Habits ──────────────────────────────────────────────────────

    private void appendHabitsSnapshot(StringBuilder sb, String userUid) {
        List<Habit> habits = habitRepository.findAllByUserUid(userUid);
        if (habits.isEmpty()) return;

        sb.append("=== HABITS ===\n");
        String today = LocalDate.now().toString();

        for (Habit h : habits) {
            sb.append("- ").append(h.getName());

            Map<String, Object> completions = h.getCompletions();
            if (completions != null && !completions.isEmpty()) {
                int streak = calculateStreak(completions, today);
                int last7 = countCompletionsInDays(completions, today, 7);
                sb.append(" | streak: ").append(streak).append("d");
                sb.append(", last 7d: ").append(last7).append("/7");
            }

            if ("sprint".equals(h.getHabitType()) && h.getSprintEndDate() != null) {
                sb.append(" [sprint ends ").append(h.getSprintEndDate()).append("]");
            }
            sb.append("\n");
        }
        sb.append("\n");
    }

    private int calculateStreak(Map<String, Object> completions, String today) {
        int streak = 0;
        LocalDate date = LocalDate.parse(today);
        for (int i = 0; i < 365; i++) {
            String key = date.minusDays(i).toString();
            Object val = completions.get(key);
            if (isTruthy(val)) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    private int countCompletionsInDays(Map<String, Object> completions, String today, int days) {
        int count = 0;
        LocalDate date = LocalDate.parse(today);
        for (int i = 0; i < days; i++) {
            String key = date.minusDays(i).toString();
            if (isTruthy(completions.get(key))) count++;
        }
        return count;
    }

    private boolean isTruthy(Object val) {
        if (val == null) return false;
        if (val instanceof Boolean b) return b;
        if (val instanceof Number n) return n.intValue() > 0;
        return "true".equalsIgnoreCase(val.toString());
    }

    // ── Schedule ────────────────────────────────────────────────────

    private void appendScheduleSnapshot(StringBuilder sb, String userUid) {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        String dayOfWeek = LocalDate.now().getDayOfWeek().name();
        // Capitalize first letter
        dayOfWeek = dayOfWeek.charAt(0) + dayOfWeek.substring(1).toLowerCase();

        // Planner items for today (check both date format and day-of-week name)
        List<PlannerItem> todayItems = plannerItemRepository.findAllByUserUidAndDay(userUid, today);
        List<PlannerItem> dayItems = plannerItemRepository.findAllByUserUidAndDay(userUid, dayOfWeek);

        Set<UUID> seen = new HashSet<>();
        List<PlannerItem> allToday = new ArrayList<>();
        for (PlannerItem item : todayItems) {
            if (seen.add(item.getId())) allToday.add(item);
        }
        for (PlannerItem item : dayItems) {
            if (seen.add(item.getId())) allToday.add(item);
        }

        // Todos
        List<TodoItem> todos = todoRepository.findAllByUserUid(userUid);
        List<TodoItem> pending = todos.stream()
                .filter(t -> !Boolean.TRUE.equals(t.getCompleted()))
                .toList();
        List<TodoItem> highPri = pending.stream()
                .filter(t -> "high".equals(t.getPriority()))
                .toList();

        if (allToday.isEmpty() && pending.isEmpty()) return;

        sb.append("=== TODAY'S SCHEDULE ===\n");

        if (!allToday.isEmpty()) {
            allToday.sort(Comparator.comparing(PlannerItem::getStartTime));
            for (PlannerItem item : allToday) {
                sb.append("- ").append(item.getStartTime()).append("-").append(item.getEndTime())
                  .append(": ").append(item.getTitle());
                if (item.getTag() != null) sb.append(" [").append(item.getTag()).append("]");
                sb.append("\n");
            }
        }

        if (!highPri.isEmpty()) {
            sb.append("High-priority todos: ");
            sb.append(highPri.stream().map(TodoItem::getText).collect(Collectors.joining(", ")));
            sb.append("\n");
        }

        sb.append("Pending todos: ").append(pending.size()).append(" remaining\n");
        sb.append("\n");
    }

    // ── Notes ───────────────────────────────────────────────────────

    private void appendNotesSnapshot(StringBuilder sb, String userUid) {
        long count = noteRepository.countByUserUid(userUid);
        if (count == 0) return;

        List<Note> recent = noteRepository.findAllByUserUidOrderByCreatedAtDesc(userUid)
                .stream().limit(5).toList();

        sb.append("=== NOTES ===\n");
        sb.append("Total notes: ").append(count).append("\n");
        sb.append("Recent:\n");
        for (Note n : recent) {
            sb.append("- ").append(n.getTitle());
            if (n.getType() != null) sb.append(" [").append(n.getType()).append("]");
            sb.append("\n");
        }
        sb.append("\n");
    }

    // ── Recent Activity ─────────────────────────────────────────────

    private void appendRecentActivity(StringBuilder sb, String userUid) {
        List<ActivityLog> logs = activityLogRepository
                .findByUserUidOrderByCreatedAtDesc(userUid, PageRequest.of(0, 10));
        if (logs.isEmpty()) return;

        sb.append("=== RECENT ACTIVITY ===\n");
        for (ActivityLog log : logs) {
            sb.append("- [").append(log.getFeature()).append("] ").append(log.getSummary());
            if (log.getCreatedAt() != null) {
                sb.append(" (").append(formatRelativeTime(log.getCreatedAt())).append(")");
            }
            sb.append("\n");
        }
        sb.append("\n");
    }

    private String formatRelativeTime(Instant time) {
        long hours = ChronoUnit.HOURS.between(time, Instant.now());
        if (hours < 1) return "just now";
        if (hours < 24) return hours + "h ago";
        long days = hours / 24;
        if (days == 1) return "yesterday";
        return days + "d ago";
    }
}
