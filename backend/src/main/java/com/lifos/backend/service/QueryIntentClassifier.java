package com.lifos.backend.service;

import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Keyword-based fast query intent classifier for selective structured context injection.
 * No LLM call — runs in constant time.
 */
@Service
public class QueryIntentClassifier {

    public enum Intent {
        HABITS,
        TODOS,
        SCHEDULE,
        PERSONAL,
        MEMORY,
        JOURNAL,
        NOTES,
        AI,
        GENERAL
    }

    private static final Map<Intent, Set<String>> INTENT_KEYWORDS = Map.of(
            Intent.HABITS,   Set.of("habit", "streak", "routine", "daily", "check-in", "consistency"),
            Intent.TODOS,    Set.of("todo", "todos", "task", "tasks", "checklist", "to-do", "to do", "pending", "finish", "done"),
            Intent.SCHEDULE, Set.of("schedule", "today", "plan", "calendar", "meeting", "appointment", "tomorrow", "planner"),
            Intent.PERSONAL, Set.of("about me", "who am i", "my profile", "interests", "bio", "myself"),
            Intent.MEMORY,   Set.of("remember", "told you", "recall", "mentioned", "last time", "you know")
    );

    // Separate map for additional intents (Map.of has a 10-entry limit)
    private static final Map<Intent, Set<String>> EXTRA_INTENT_KEYWORDS = Map.of(
            Intent.JOURNAL,  Set.of("journal", "diary", "entry", "wrote", "logged", "reflection"),
            Intent.NOTES,    Set.of("note", "notes", "jotted", "saved", "wrote down", "document"),
            Intent.AI,       Set.of("chat history", "previous conversation", "last chat", "what did i say", "conversation")
    );

    /**
     * Classifies a user query into one or more intents.
     * Returns {@link Intent#GENERAL} if no specific intent is detected.
     */
    public Set<Intent> classify(String query) {
        if (query == null || query.isBlank()) {
            return Set.of(Intent.GENERAL);
        }

        String lower = query.toLowerCase(Locale.ROOT);
        Set<Intent> intents = EnumSet.noneOf(Intent.class);

        for (var entry : INTENT_KEYWORDS.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (lower.contains(keyword)) {
                    intents.add(entry.getKey());
                    break;
                }
            }
        }

        for (var entry : EXTRA_INTENT_KEYWORDS.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (lower.contains(keyword)) {
                    intents.add(entry.getKey());
                    break;
                }
            }
        }

        return intents.isEmpty() ? Set.of(Intent.GENERAL) : intents;
    }
}
