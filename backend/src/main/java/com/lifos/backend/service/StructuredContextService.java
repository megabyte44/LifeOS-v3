package com.lifos.backend.service;

import com.lifos.backend.entity.*;
import com.lifos.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Gathers hard facts from SQL (not vector search) for AI context injection.
 * Covers: profile, habits, goals, gym, finance, schedule, recent activity.
 * Target: ~2000 tokens of natural-language context.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StructuredContextService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final HabitRepository habitRepository;
    private final GoalRepository goalRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final PlannerItemRepository plannerItemRepository;
    private final TodoRepository todoRepository;
    private final ActivityLogRepository activityLogRepository;
    private final GymCompletionRepository gymCompletionRepository;
    private final WorkoutSplitRepository workoutSplitRepository;
    private final ProteinIntakeRepository proteinIntakeRepository;
    private final ProteinTargetRepository proteinTargetRepository;
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
        if (all || intents.contains(QueryIntentClassifier.Intent.GOALS)) {
            appendGoalsSnapshot(sb, userUid);
        }
        if (all || intents.contains(QueryIntentClassifier.Intent.GYM)) {
            appendGymSnapshot(sb, userUid);
        }
        if (all || intents.contains(QueryIntentClassifier.Intent.FINANCE)) {
            appendFinanceSnapshot(sb, userUid);
        }
        if (all || intents.contains(QueryIntentClassifier.Intent.SCHEDULE)) {
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

    // ── Goals ───────────────────────────────────────────────────────

    private void appendGoalsSnapshot(StringBuilder sb, String userUid) {
        List<Goal> goals = goalRepository.findAllByUserUidWithChildren(userUid);
        List<Goal> active = goals.stream()
                .filter(g -> !Boolean.TRUE.equals(g.getArchived()) && g.getCompletedAt() == null)
                .toList();
        if (active.isEmpty()) return;

        sb.append("=== ACTIVE GOALS ===\n");
        for (Goal g : active) {
            sb.append("- ").append(g.getTitle());
            if (g.getCategory() != null) sb.append(" [").append(g.getCategory()).append("]");

            // Calculate progress from sub-goals
            if (g.getSubGoals() != null && !g.getSubGoals().isEmpty()) {
                long done = g.getSubGoals().stream().filter(s -> Boolean.TRUE.equals(s.getCompleted())).count();
                long total = g.getSubGoals().size();
                int pct = total > 0 ? (int) Math.round((double) done / total * 100) : 0;
                sb.append(" | ").append(pct).append("% (").append(done).append("/").append(total).append(" sub-goals)");
            }

            if (g.getTargetDate() != null) {
                sb.append(" | target: ").append(g.getTargetDate());
                long daysLeft = daysUntil(g.getTargetDate());
                if (daysLeft >= 0 && daysLeft <= 30) {
                    sb.append(" (").append(daysLeft).append("d left)");
                }
            }
            sb.append("\n");
        }
        sb.append("\n");
    }

    private long daysUntil(String dateStr) {
        try {
            LocalDate target = LocalDate.parse(dateStr);
            return ChronoUnit.DAYS.between(LocalDate.now(), target);
        } catch (Exception e) {
            return -1;
        }
    }

    // ── Gym ─────────────────────────────────────────────────────────

    private void appendGymSnapshot(StringBuilder sb, String userUid) {
        Optional<WorkoutSplit> splitOpt = workoutSplitRepository.findByUserUid(userUid);
        Optional<GymCompletion> compOpt = gymCompletionRepository.findByUserUid(userUid);

        boolean hasGymData = splitOpt.isPresent() || compOpt.isPresent();
        if (!hasGymData) return;

        sb.append("=== GYM ===\n");

        splitOpt.ifPresent(split -> {
            Map<String, Object> splitData = split.getSplit();
            if (splitData != null && !splitData.isEmpty()) {
                sb.append("Workout split: ").append(splitData.size()).append(" days configured\n");
            }
        });

        compOpt.ifPresent(comp -> {
            Map<String, Object> completions = comp.getCompletions();
            if (completions != null && !completions.isEmpty()) {
                String today = LocalDate.now().toString();
                int last7 = 0;
                for (int i = 0; i < 7; i++) {
                    String key = LocalDate.now().minusDays(i).toString();
                    if (isTruthy(completions.get(key))) last7++;
                }
                sb.append("Workouts last 7d: ").append(last7).append("\n");
                boolean todayDone = isTruthy(completions.get(today));
                sb.append("Today: ").append(todayDone ? "completed" : "not yet").append("\n");
            }
        });

        // Protein
        proteinTargetRepository.findByUserUid(userUid).ifPresent(pt -> {
            List<ProteinIntake> intakes = proteinIntakeRepository.findAllByUserUid(userUid);
            String today = LocalDate.now().toString();
            int todayProtein = intakes.stream()
                    .filter(pi -> pi.getTimestamp().atZone(ZoneId.systemDefault()).toLocalDate().toString().equals(today))
                    .mapToInt(ProteinIntake::getAmount)
                    .sum();
            sb.append("Protein today: ").append(todayProtein).append("g / ").append(pt.getTarget()).append("g target\n");
        });

        sb.append("\n");
    }

    // ── Finance ─────────────────────────────────────────────────────

    private void appendFinanceSnapshot(StringBuilder sb, String userUid) {
        List<Transaction> transactions = transactionRepository.findAllByUserUidOrderByDateDesc(userUid);
        if (transactions.isEmpty()) return;

        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);

        long[] totals = {0, 0}; // [expenses, income]
        Map<String, Long> categorySpend = new HashMap<>();

        for (Transaction t : transactions) {
            if (t.getDate() != null && !t.getDate().isBefore(monthStart)) {
                if ("expense".equals(t.getType()) || "fee".equals(t.getType())) {
                    totals[0] += Math.abs(t.getAmount());
                    categorySpend.merge(t.getCategory(), Math.abs(t.getAmount()), Long::sum);
                } else if ("income".equals(t.getType())) {
                    totals[1] += t.getAmount();
                }
            }
        }

        long monthExpenses = totals[0];
        long monthIncome = totals[1];

        sb.append("=== FINANCE (this month) ===\n");
        sb.append("Spending: $").append(String.format("%.2f", monthExpenses / 100.0));

        budgetRepository.findByUserUid(userUid).ifPresent(budget -> {
            if (budget.getBudget() > 0) {
                double pct = (double) monthExpenses / budget.getBudget() * 100;
                sb.append(" / $").append(String.format("%.2f", budget.getBudget() / 100.0))
                  .append(" budget (").append(String.format("%.0f", pct)).append("%)");
            }
        });
        sb.append("\n");

        if (monthIncome > 0) {
            sb.append("Income: $").append(String.format("%.2f", monthIncome / 100.0)).append("\n");
        }

        // Top 3 spending categories
        if (!categorySpend.isEmpty()) {
            sb.append("Top categories: ");
            categorySpend.entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .limit(3)
                    .forEach(e -> sb.append(e.getKey()).append(" ($")
                            .append(String.format("%.2f", e.getValue() / 100.0)).append("), "));
            sb.setLength(sb.length() - 2); // remove trailing comma
            sb.append("\n");
        }
        sb.append("\n");
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
