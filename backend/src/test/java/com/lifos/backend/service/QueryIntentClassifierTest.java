package com.lifos.backend.service;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for {@link QueryIntentClassifier}.
 *
 * Covers every intent bucket (including Phase 3 additions) plus edge cases:
 * - Null / blank → GENERAL fallback
 * - Case-insensitive matching
 * - Multi-intent queries
 * - No-match queries → GENERAL
 * - Original intents still work (regression)
 * - New Phase 3 intents: JOURNAL, NOTES, AI
 */
class QueryIntentClassifierTest {

    private final QueryIntentClassifier classifier = new QueryIntentClassifier();

    // ── Edge cases ─────────────────────────────────────────────────────────

    @Test
    void nullQuery_returnsGeneral() {
        assertThat(classifier.classify(null)).containsExactly(QueryIntentClassifier.Intent.GENERAL);
    }

    @Test
    void blankQuery_returnsGeneral() {
        assertThat(classifier.classify("   ")).containsExactly(QueryIntentClassifier.Intent.GENERAL);
    }

    @Test
    void noMatchQuery_returnsGeneral() {
        assertThat(classifier.classify("hey what's up"))
                .containsExactly(QueryIntentClassifier.Intent.GENERAL);
    }

    // ── Original intents (regression) ─────────────────────────────────────

    @Test
    void habitKeyword_returnsHabits() {
        assertThat(classifier.classify("how is my habit streak?"))
                .contains(QueryIntentClassifier.Intent.HABITS);
    }

    @Test
    void goalKeyword_returnsGoals() {
        assertThat(classifier.classify("show me goal progress"))
                .contains(QueryIntentClassifier.Intent.GOALS);
    }

    @Test
    void gymKeyword_returnsGym() {
        assertThat(classifier.classify("what's my workout plan?"))
                .contains(QueryIntentClassifier.Intent.GYM);
    }

    @Test
    void proteinKeyword_returnsGym() {
        assertThat(classifier.classify("did I hit my protein target today?"))
                .contains(QueryIntentClassifier.Intent.GYM);
    }

    @Test
    void financeKeyword_returnsFinance() {
        assertThat(classifier.classify("how much did I spend this month?"))
                .contains(QueryIntentClassifier.Intent.FINANCE);
    }

    @Test
    void budgetKeyword_returnsFinance() {
        assertThat(classifier.classify("am I within budget?"))
                .contains(QueryIntentClassifier.Intent.FINANCE);
    }

    @Test
    void scheduleKeyword_returnsSchedule() {
        assertThat(classifier.classify("what's on my schedule today?"))
                .contains(QueryIntentClassifier.Intent.SCHEDULE);
    }

    @Test
    void tomorrowKeyword_returnsSchedule() {
        assertThat(classifier.classify("do I have a meeting tomorrow?"))
                .contains(QueryIntentClassifier.Intent.SCHEDULE);
    }

    @Test
    void rememberKeyword_returnsMemory() {
        assertThat(classifier.classify("do you remember what I told you?"))
                .contains(QueryIntentClassifier.Intent.MEMORY);
    }

    @Test
    void recallKeyword_returnsMemory() {
        assertThat(classifier.classify("can you recall what I mentioned last time?"))
                .contains(QueryIntentClassifier.Intent.MEMORY);
    }

    @Test
    void bioKeyword_returnsPersonal() {
        assertThat(classifier.classify("update my bio"))
                .contains(QueryIntentClassifier.Intent.PERSONAL);
    }

    // ── Phase 3: new intents ───────────────────────────────────────────────

    @Test
    void journalKeyword_returnsJournal() {
        assertThat(classifier.classify("what did I write in my journal yesterday?"))
                .contains(QueryIntentClassifier.Intent.JOURNAL);
    }

    @Test
    void diaryKeyword_returnsJournal() {
        assertThat(classifier.classify("show me my diary entry for last week"))
                .contains(QueryIntentClassifier.Intent.JOURNAL);
    }

    @Test
    void reflectionKeyword_returnsJournal() {
        assertThat(classifier.classify("I want to do a reflection today"))
                .contains(QueryIntentClassifier.Intent.JOURNAL);
    }

    @Test
    void noteKeyword_returnsNotes() {
        assertThat(classifier.classify("find my note about algorithms"))
                .contains(QueryIntentClassifier.Intent.NOTES);
    }

    @Test
    void notesPlural_returnsNotes() {
        assertThat(classifier.classify("show me all my notes"))
                .contains(QueryIntentClassifier.Intent.NOTES);
    }

    @Test
    void documentKeyword_returnsNotes() {
        assertThat(classifier.classify("search through my document on system design"))
                .contains(QueryIntentClassifier.Intent.NOTES);
    }

    @Test
    void chatHistoryKeyword_returnsAi() {
        assertThat(classifier.classify("search my chat history for that answer"))
                .contains(QueryIntentClassifier.Intent.AI);
    }

    @Test
    void previousConversationKeyword_returnsAi() {
        assertThat(classifier.classify("in our previous conversation you explained this"))
                .contains(QueryIntentClassifier.Intent.AI);
    }

    @Test
    void conversationKeyword_returnsAi() {
        assertThat(classifier.classify("look at our conversation from yesterday"))
                .contains(QueryIntentClassifier.Intent.AI);
    }

    // ── Case-insensitivity ─────────────────────────────────────────────────

    @Test
    void upperCaseQuery_matchesCorrectly() {
        assertThat(classifier.classify("WHAT IS MY GYM WORKOUT SPLIT?"))
                .contains(QueryIntentClassifier.Intent.GYM);
    }

    @Test
    void mixedCaseNewIntent_matchesJournal() {
        assertThat(classifier.classify("Open my JOURNAL for today"))
                .contains(QueryIntentClassifier.Intent.JOURNAL);
    }

    // ── Multi-intent queries ───────────────────────────────────────────────

    @Test
    void habitAndGoalQuery_returnsBothIntents() {
        Set<QueryIntentClassifier.Intent> intents =
                classifier.classify("show my goal related to my daily habit");
        assertThat(intents).contains(
                QueryIntentClassifier.Intent.HABITS,
                QueryIntentClassifier.Intent.GOALS);
    }

    @Test
    void financeAndScheduleQuery_returnsBothIntents() {
        Set<QueryIntentClassifier.Intent> intents =
                classifier.classify("what meeting do I have today and how much budget is left?");
        assertThat(intents).contains(
                QueryIntentClassifier.Intent.FINANCE,
                QueryIntentClassifier.Intent.SCHEDULE);
    }

    @Test
    void journalAndMemoryQuery_returnsBothIntents() {
        Set<QueryIntentClassifier.Intent> intents =
                classifier.classify("recall what I wrote in my journal and remember the reflection");
        assertThat(intents).contains(
                QueryIntentClassifier.Intent.JOURNAL,
                QueryIntentClassifier.Intent.MEMORY);
    }

    @Test
    void multiIntentQuery_doesNotReturnGeneral() {
        Set<QueryIntentClassifier.Intent> intents =
                classifier.classify("show my gym progress and budget");
        assertThat(intents).doesNotContain(QueryIntentClassifier.Intent.GENERAL);
    }
}
