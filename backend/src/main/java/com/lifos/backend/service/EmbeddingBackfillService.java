package com.lifos.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.lifos.backend.entity.Goal;
import com.lifos.backend.entity.Note;
import com.lifos.backend.entity.User;
import com.lifos.backend.repository.GoalRepository;
import com.lifos.backend.repository.NoteRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * One-shot backfill that embeds all existing notes and goals for every user.
 * Safe to call multiple times — EmbeddingService deduplicates by content hash.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmbeddingBackfillService {

    private final UserRepository userRepository;
    private final NoteRepository noteRepository;
    private final GoalRepository goalRepository;
    private final EmbeddingService embeddingService;

    /**
     * Queues all user note/goal embeddings asynchronously.
     * Returns immediately; actual work runs in the background thread pool.
     */
    @Async
    public void backfillAll() {
        List<User> users = userRepository.findAll();
        AtomicInteger total = new AtomicInteger();

        log.info("Starting embedding backfill for {} users", users.size());

        for (User user : users) {
            String uid = user.getUid();
            try {
                List<Note> notes = noteRepository.findAllByUserUidOrderByCreatedAtDesc(uid);
                for (Note note : notes) {
                    try {
                        embeddingService.embedAndStore(uid, "note", note.getId(), buildNoteText(note));
                        total.incrementAndGet();
                    } catch (Exception e) {
                        log.warn("Backfill failed for note {} user {}: {}", note.getId(), uid, e.getMessage());
                    }
                }

                List<Goal> goals = goalRepository.findAllByUserUidWithChildren(uid);
                for (Goal goal : goals) {
                    try {
                        embeddingService.embedAndStore(uid, "goal", goal.getId(), buildGoalText(goal));
                        total.incrementAndGet();
                    } catch (Exception e) {
                        log.warn("Backfill failed for goal {} user {}: {}", goal.getId(), uid, e.getMessage());
                    }
                }
            } catch (Exception e) {
                log.warn("Backfill skipped for user {}: {}", uid, e.getMessage());
            }
        }

        log.info("Embedding backfill complete — {} documents processed", total.get());
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

    private String buildGoalText(Goal goal) {
        return goal.getTitle() + "\n" + goal.getDescription() + "\n" + goal.getMotive();
    }
}
