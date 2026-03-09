# Plan: LifeOS Second Brain — RAG AI Integration + RAGAS Evaluation

> **Project context**: LifeOS is a **personal/portfolio group project** — built to showcase to interviewers and friends. Not a multi-user SaaS. The goal is demonstrating deep technical competence: hybrid RAG pipelines, real-time streaming, event-driven architecture, LLM-as-judge evaluation, and a polished full-stack experience. Every feature should be **demo-ready** and explainable in an interview.

Transform the existing AI chat proxy into a context-aware **"Second Brain"** using pgvector semantic search + SQL structured queries, SSE streaming, proactive push insights, and **RAGAS evaluation metrics** to measure pipeline quality.

---

## Architecture

```
User Message (Next.js chat UI)
    │
    ▼
POST /api/ai/chat/stream (SSE)
    │
    ├──► PromptAssemblyService
    │       ├──► StructuredContextService (SQL)
    │       │     Profile, Habits, Goals, Gym, Finance, Schedule, ActivityLog
    │       ├──► EmbeddingService.searchSimilar() (pgvector cosine)
    │       │     → Top 5 matching notes, goal descriptions, journals
    │       └──► Assemble: system_prompt + context + conversation + message
    │
    ▼
LLM Provider (streaming) → SSE chunks → Frontend token rendering
    │
    └──► @Async RagEvaluationListener
              ├── Faithfulness (claims vs context)
              ├── Answer Relevancy (cosine similarity of generated Qs)
              ├── Context Precision (relevant chunks / total)
              └── Store scores → rag_evaluations table → Admin Dashboard

Background:
  @Scheduled InsightGeneratorService → detect patterns → LLM insight → push notification
```

---

## Phase 1: Database & Embedding Foundation

| Step | What | Migration |
|------|------|-----------|
| 1.1 | Install pgvector extension, add `hibernate-vector` to pom.xml | — |
| 1.2 | **UserProfile** table — age, bio, philosophy, interests, sleep target, occupation, life motto | V16 |
| 1.3 | **Embeddings** table — `vector(1536)` column, source_type, content_hash (SHA-256 dedup), IVFFlat index | V17 |
| 1.4 | **ActivityLog** table — feature, action, entity_id, summary, metadata (JSONB) | V18 |
| 1.5 | **Note tagging** — add tags (JSONB), linked_feature, linked_entity_id to notes | V19 |
| 1.6 | **ConversationMemories** table — extracted user facts from chats, with supersession tracking | V21 |

### Step 1.1 — Install pgvector extension
- Enable `pgvector` in PostgreSQL (`CREATE EXTENSION IF NOT EXISTS vector;`)
- Add `hibernate-vector` dependency to pom.xml (e.g., `org.hibernate.orm:hibernate-vector`)

### Step 1.2 — V16: UserProfile table (identity/demographic data)
- Fields: `id (UUID)`, `user_uid (FK, unique)`, `age (int)`, `bio (TEXT)`, `philosophy (TEXT)`, `interests (JSONB array)`, `sleep_target_hours (float)`, `daily_calorie_target (int)`, `protein_target_override (int)`, `occupation (VARCHAR)`, `timezone (VARCHAR)`, `life_motto (TEXT)`, `created_at`, `updated_at`
- Entity: `UserProfile.java`, Repository, Service, DTO
- Endpoints: `GET /api/profile`, `PUT /api/profile`
- Gives the AI hard facts: *"You're 25, a software engineer, aiming for 8h sleep and 150g protein"*

### Step 1.3 — V17: Embeddings table (vector storage)
- Fields: `id (UUID)`, `user_uid (FK)`, `source_type (VARCHAR)` — "note", "goal_description", "goal_motive", "goal_note", "user_philosophy", `source_id (UUID)`, `content_hash (VARCHAR)` — SHA-256 of source text to detect changes, `content_preview (TEXT)` — first 200 chars for debugging, `embedding (vector(1536))` — OpenAI text-embedding-3-small dimension, `created_at`, `updated_at`
- Indexes: `ivfflat` index on `embedding` column for fast cosine similarity, composite index on `(user_uid, source_type)`

### Step 1.4 — V18: ActivityLog table (cross-feature timeline)
- Fields: `id (UUID)`, `user_uid (FK)`, `feature (VARCHAR)` — "habit", "goal", "gym", "expense", "note", "todo", "planner", `action (VARCHAR)` — "created", "completed", "updated", "deleted", "streak_hit", "streak_broken", "budget_exceeded", `entity_id (UUID)`, `summary (TEXT)` — human-readable: "Completed habit 'Meditation' (Day 15 streak)", `metadata (JSONB)`, `created_at`
- Index on `(user_uid, created_at DESC)` for temporal queries

### Step 1.5 — V19: Add note tagging fields
- Add to `notes` table: `tags (JSONB array)` — ["journal", "philosophy", "gym-log", "finance-review", "goal-reflection", "daily-review", "idea"], `linked_feature (VARCHAR)` — nullable, e.g., "goal", "habit", "gym", `linked_entity_id (UUID)` — nullable
- Update `Note.java` entity with new fields, update DTOs

---

## Phase 2: Embedding Pipeline

| Step | What |
|------|------|
| 2.1 | `OpenAiEmbeddingClient` — calls `text-embedding-3-small`, returns `float[1536]` |
| 2.2 | `EmbeddingService` — `embedAndStore()` (hash check → skip if unchanged), `searchSimilar()` (cosine), `deleteBySource()` |
| 2.3 | Async events: `NoteUpdatedEvent`, `GoalUpdatedEvent`, `UserProfileUpdatedEvent` → `EmbeddingEventListener` embeds on save |
| 2.4 | **Conversation memory extraction** — LLM extracts user facts from chat → stores + embeds with dedup/supersession |

**Embedded**: Notes text, Goal descriptions+motives, GoalNotes, UserProfile philosophy/bio/motto, **extracted conversation memories**
**NOT embedded**: Structured numbers (habits, transactions, gym stats) — those use SQL

### Step 2.1 — OpenAI Embedding Client
- New service `OpenAiEmbeddingClient.java`
- Calls `POST https://api.openai.com/v1/embeddings` with model `text-embedding-3-small`
- Input: text string, Output: `float[1536]`
- Reads API key from `AiConfiguration.apiKeys["openai"]` (already exists in DB)

### Step 2.2 — EmbeddingService
- New service `EmbeddingService.java`
- Methods:
  - `embedAndStore(userUid, sourceType, sourceId, text)` — hash text, skip if unchanged, call OpenAI, upsert embedding
  - `deleteBySource(sourceType, sourceId)` — cleanup on entity delete
  - `searchSimilar(userUid, queryText, limit)` — embed query, then pgvector cosine search `ORDER BY embedding <=> query_vector LIMIT N`
- Content preprocessing: strip markdown syntax, truncate to ~8000 tokens, concat title + content for notes

### Step 2.3 — Async Embedding on Save
- Use Spring `@Async` + `@EventListener` pattern
- Define domain events: `NoteUpdatedEvent`, `GoalUpdatedEvent`, `UserProfileUpdatedEvent`
- Publish events from `NoteService.create/update`, `GoalService.create/update`, `UserProfileService.update`
- `EmbeddingEventListener.java` handles events asynchronously:
  - **Note saved**: embed `title + " " + flattenedContent` (extract text from JSONB)
  - **Goal saved**: embed `title + " " + motive + " " + description`
  - **GoalNote saved**: embed `title + " " + content`
  - **UserProfile saved**: embed `philosophy + " " + bio + " " + lifeMotto`
- On delete: remove corresponding embedding rows

### Step 2.4 — Conversation Memory Extraction (learn from chat)
The second brain should **learn from what the user tells it**. When a user says *"I just got promoted to senior engineer"* or *"I've been struggling with sleep lately"*, that becomes a reusable memory — not just lost in chat history.

**How it works:**
- After each RAG chat response completes (same event hook as RAGAS), extract user-revealed facts
- New `ConversationMemoryService.java`:
  - Takes the user's messages from the conversation (not the AI's responses)
  - Calls LLM with an extraction prompt:
    ```
    Extract any personal facts, preferences, life updates, decisions, feelings, 
    or insights the user revealed about themselves. Return as a JSON array of 
    short statements. Return empty array if nothing notable.
    
    Examples: ["Got promoted to senior engineer", "Struggling with sleep this week", 
    "Decided to switch from PPL to Upper/Lower split", "Wants to save $5000 by June"]
    ```
  - Each extracted statement gets:
    1. Stored in a new **`conversation_memories`** table (for browsability/management)
    2. Embedded into the `embeddings` table with `source_type = "conversation_memory"`

**New table — V21: conversation_memories**
- `id (UUID)`, `user_uid (FK)`, `memory_text (TEXT)` — the extracted statement, `source_conversation_date (TIMESTAMP)` — when the conversation happened, `category (VARCHAR)` — auto-classified: "life_update", "preference", "feeling", "decision", "goal", "insight", `confidence (FLOAT)` — LLM's confidence in the extraction (0-1), `superseded_by (UUID, nullable)` — points to newer memory that updates this one, `active (BOOLEAN, default true)` — false if superseded or user-deleted, `created_at`
- Index on `(user_uid, active, created_at DESC)`

**Deduplication & contradiction handling:**
- Before storing, vector-search existing memories for high similarity (>0.92 cosine)
- If found: LLM judges if the new fact **updates** the old one (e.g., "sleeping 6 hours" supersedes "sleeping 5 hours") → mark old as `active=false, superseded_by=new_id`
- If found but **same meaning**: skip (don't create duplicate)
- If not found: store as new memory

**Memory context injection** (added to PromptAssemblyService):
- Query: `SELECT memory_text FROM conversation_memories WHERE user_uid=? AND active=true ORDER BY created_at DESC LIMIT 20`
- Injected as a new context section:
  ```
  === THINGS YOU'VE TOLD ME ===
  - Got promoted to senior engineer (2 days ago)
  - Training for a half marathon in April
  - Prefers evening workouts over morning
  - Wants to reduce sugar intake
  ```

**Memory management:**
- Endpoint: `GET /api/memories` — list active conversation memories (see what the AI "remembers")
- Endpoint: `DELETE /api/memories/{id}` — delete a memory you don't want the AI to use
- Show a "What I remember about you" section in the profile/settings page — great demo moment in interviews

**Interview talking points**: event-driven extraction, vector dedup with cosine threshold, supersession chain for contradictions, LLM-as-classifier for categories


---

## Phase 3: Hybrid Context Assembly (parallel with Phase 2)

| Step | What |
|------|------|
| 3.1 | `StructuredContextService` — SQL queries to build natural-language snapshot (~2000 tokens): profile, habits (streaks), goals (progress %), gym (today's workout, protein), finance (budget status), schedule (today's plan), activity log (last 10) |
| 3.2 | `PromptAssemblyService` — stitches: system prompt → user profile → life snapshot → recent activity → top 5 vector results → conversation → user message. Budget: ~4000 tokens context |

### Step 3.1 — StructuredContextService
- New service `StructuredContextService.java`
- Gathers hard facts per user via SQL (called at query time):
  - **Profile**: age, occupation, sleep target, protein target, philosophy (from UserProfile)
  - **Habits summary**: active habits with current streak length, last 7 days completion rate
  - **Goals summary**: active (non-archived) goals with title, category, progress %, target date
  - **Gym snapshot**: current workout split name, today's workout, protein intake today vs target, recent PR history
  - **Finance snapshot**: this month's spending total vs budget, top 3 spending categories, income vs expenses
  - **Schedule**: today's planner items, pending high-priority todos
  - **Recent activity**: last 10 entries from ActivityLog
- Output: a formatted text block (natural language for the LLM, not raw JSON)
- Token budget: ~2000 tokens for structured context

### Step 3.2 — PromptAssemblyService
- New service `PromptAssemblyService.java`
- Assembles the full prompt:
  ```
  [SYSTEM PROMPT — personality from AiConfiguration.systemInstructions]
  
  [CONTEXT BLOCK — hidden from user]
  === USER PROFILE ===
  {structured profile data}
  === LIFE SNAPSHOT ===
  {habits, goals, gym, finance, schedule summaries}
  === RECENT ACTIVITY ===
  {last 10 activity log entries}
  === THINGS YOU'VE TOLD ME ===
  {active conversation memories, most recent 20}
  === RELEVANT MEMORIES ===
  {top 5 vector search results with source type labels}
  [END CONTEXT]
  
  [CONVERSATION HISTORY — last 10 messages]
  [USER'S NEW MESSAGE]
  ```
- Token management: total context fits ~4000 tokens, leaving room for response

---

## Phase 4: Streaming RAG Chat Endpoint

| Step | What |
|------|------|
| 4.1 | **Backend**: `POST /api/ai/chat/stream` → SSE via `SseEmitter`. Streaming WebClient call to LLM. Keep old `/chat` as fallback |
| 4.2 | **Frontend**: `fetch()` + `ReadableStream` reader in ai-chat/page.tsx. Token-by-token rendering |
| 4.3 | **Profile page**: Extended form in profile/page.tsx — identity data that feeds into AI context |

### Step 4.1 — Backend SSE Streaming
- New endpoint: `POST /api/ai/chat/stream` → returns `text/event-stream` (SSE)
- Controller returns `SseEmitter` or `Flux<ServerSentEvent<String>>`
- Flow:
  1. Receive `AiChatRequest` (same DTO as current)
  2. Call `PromptAssemblyService` to build context-enriched messages
  3. Make streaming HTTP call to LLM provider (WebClient for OpenRouter/OpenAI, or Gemini streaming API)
  4. Forward each chunk as SSE event: `data: {"token": "..."}\n\n`
  5. Final event: `data: [DONE]\n\n`
- Keep the old `POST /api/ai/chat` working (non-streaming fallback)

### Step 4.2 — Frontend SSE Consumer
- Update ai-chat/page.tsx to use `fetch()` with streaming body reader
- Pattern: `ReadableStream` reader that processes chunks incrementally
- Progressive rendering: append tokens to the AI message bubble in real-time
- Fallback: if streaming fails, fall back to non-streaming endpoint
- Update ai-chat.service.ts with `sendMessageStream()` method

### Step 4.3 — Frontend Profile Page
- Extended form in profile or settings: age, bio, philosophy, interests (tag input), sleep target, calorie target, occupation, life motto
- Calls `PUT /api/profile`
- This data feeds directly into AI context

---

## Phase 5: Activity Feed & Cross-Feature Linking

| Step | What |
|------|------|
| 5.1 | `ActivityLogService` — hook into HabitService (streak milestones), GoalService (completions), GymService (PRs), TransactionService (budget alerts), TodoService |
| 5.2 | Note tagging UI — multi-select tag picker, optional feature linking, tag badges on cards |

### Step 5.1 — ActivityLogService
- New service `ActivityLogService.java`
- Method: `log(userUid, feature, action, entityId, summary, metadata)`
- Integrate into existing services (add calls at key moments):
  - `HabitService`: log streak milestones (7, 30, 100 days), streak breaks, sprint completions
  - `GoalService`: log goal created, sub-goal completed, goal archived/completed
  - `GymService`: log workout completed, new PR hit, protein target met
  - `TransactionService`: log when monthly spending exceeds budget, large transactions
  - `TodoService`: log when all high-priority todos completed
  - `NoteService`: log note created (with tag info)

### Step 5.2 — Note Tagging UI
- Update notes create/edit form to include:
  - Tag selector (multi-select: journal, philosophy, gym-log, finance-review, goal-reflection, daily-review, idea)
  - Optional: link to feature (goal, habit) with entity picker
- Update note display to show tags as badges

---

## Phase 6: Proactive AI Insights

| Step | What |
|------|------|
| 6.1 | `InsightGeneratorService` — `@Scheduled` daily 8 PM. Detect patterns (streak breaks, budget >80%, deadline approaching). LLM generates insight. Push via `NotificationDispatchService`. Max 2/day |

### Step 6.1 — InsightGeneratorService
- New service `InsightGeneratorService.java`
- Scheduled job (`@Scheduled(cron = "0 0 20 * * *")` — daily at 8 PM) or configurable
- Flow:
  1. Query `StructuredContextService` for snapshot
  2. Detect patterns worth highlighting:
     - Habit streak breaks (compare yesterday vs today)
     - Budget threshold crossed (>80% spent)
     - Goal deadline approaching (within 7 days)
     - Workout consistency drop (missed 3+ days)
     - Positive reinforcement (new streak milestone, all todos done)
  3. For significant patterns, call LLM with the pattern data to generate a brief, motivational insight message
  4. Send push notification via `NotificationDispatchService.dispatch()`
- Admin config: add `insightsEnabled (Boolean)` and `insightsCron (String)` to `AiConfiguration`
- **Interview talking point**: demonstrates scheduled jobs, pattern detection from cross-feature data, LLM-generated content, and push notification integration — all wired together

---

## Phase 7: RAGAS Evaluation Metrics

This is the **quality measurement layer** — implements the 4 metrics from your RAGAS image using **LLM-as-judge** (no Python sidecar needed):

| Metric | Target Score | How It Works | Needs Ground Truth? |
|--------|-------------|--------------|---------------------|
| **Faithfulness** | ≥ 0.84 | Decompose answer into claims → verify each against retrieved context → `supported/total` | No |
| **Answer Relevancy** | ≥ 0.79 | Generate hypothetical questions from answer → cosine similarity with original question | No |
| **Context Precision** | ≥ 0.88 | LLM judges each retrieved chunk's relevance → `relevant/total` (rank-weighted) | No |
| **Context Recall** | ≥ 0.76 | Check expected answer sentences against context → `attributable/total` | Yes (benchmark only) |

### Step 7.1 — V20: RAG Evaluation Tables
- New migration `V20__create_rag_evaluation_tables.sql`
- **`rag_evaluations`** table (per-interaction scores):
  - `id (UUID)`, `user_uid (FK)`, `question (TEXT)`, `answer (TEXT)`, `retrieved_contexts (JSONB)` — array of {sourceType, contentPreview, similarityScore}, `faithfulness (FLOAT)`, `answer_relevancy (FLOAT)`, `context_precision (FLOAT)`, `model_used (VARCHAR)`, `personality (VARCHAR)`, `context_token_count (INT)`, `response_time_ms (BIGINT)`, `created_at`
- **`rag_test_cases`** table (curated benchmark set for Context Recall):
  - `id (UUID)`, `question (TEXT)`, `expected_answer (TEXT)` — ground truth, `category (VARCHAR)` — "fitness", "finance", "goals", etc., `created_by (VARCHAR)`, `created_at`
- Index on `rag_evaluations(created_at DESC)` and `(user_uid, created_at DESC)`

### Step 7.2 — RagEvaluationService
- New service `RagEvaluationService.java`
- Implements 4 RAGAS metrics using LLM-as-judge prompts:

  **Faithfulness** — Decompose the answer into individual claims, then verify each claim against the retrieved context:
  - Prompt 1: "Given this answer, list each factual claim as a separate statement"
  - Prompt 2: "For each claim, is it supported by the context? Yes/No"
  - Score = supported_claims / total_claims

  **Answer Relevancy** — Generate N hypothetical questions from the answer, compare cosine similarity with original question:
  - Prompt: "Given this answer, generate 3 questions it could be answering"
  - Embed generated questions + original question via OpenAI embeddings
  - Score = average cosine similarity between generated questions and original

  **Context Precision** — LLM judges which retrieved chunks were actually useful:
  - Prompt: "Given the question, is this context chunk relevant? Yes/No" (per chunk)
  - Score = relevant_chunks / total_chunks (weighted by rank position)

  **Context Recall** (benchmark only) — Compare expected answer sentences against retrieved context:
  - Prompt: "Can this statement from the expected answer be attributed to the context? Yes/No"
  - Score = attributable_sentences / total_sentences

- Method: `evaluateAsync(question, answer, retrievedContexts)` — runs Faithfulness + Answer Relevancy + Context Precision asynchronously after each RAG chat response
- Method: `runBenchmark()` — runs all 4 metrics against `rag_test_cases` table

### Step 7.3 — Hook into Chat Pipeline
- After each streaming RAG response completes, fire `RagResponseCompletedEvent`
- `RagEvaluationListener` handles it `@Async`:
  1. Takes: question, full assembled answer, retrieved context chunks, response time
  2. Calls `RagEvaluationService.evaluateAsync()`
  3. Stores scores in `rag_evaluations`
- **Note**: Each eval makes 3-4 extra LLM calls. Sampling configurable via `AiConfiguration.evaluationSampleRate` (default: evaluate every interaction for demo purposes, tune down if API costs matter)

### Step 7.4 — Admin Evaluation Endpoints
- New controller `RagEvaluationController.java` (admin-only)
- Endpoints:
  - `GET /api/admin/rag/metrics` — aggregated scores (avg over last 7/30 days), with optional `?days=30` param
  - `GET /api/admin/rag/metrics/history` — time-series data (daily averages) for charting
  - `GET /api/admin/rag/evaluations` — paginated list of individual evaluations with scores
  - `GET /api/admin/rag/evaluations/{id}` — single evaluation detail (question, answer, contexts, scores)
  - `POST /api/admin/rag/test-cases` — CRUD for benchmark test cases
  - `POST /api/admin/rag/benchmark` — trigger benchmark run against test cases
  - `GET /api/admin/rag/benchmark/results` — latest benchmark results (all 4 metrics including Context Recall)

### Step 7.5 — Admin RAG Dashboard Page (`/admin/rag-evaluation`)
- Uses existing Recharts `ChartContainer` infrastructure
- **Layout**:
  - **Top row**: 4 stat cards showing current average scores (Faithfulness, Answer Relevancy, Context Precision, Context Recall) with colored progress bars (green/blue/purple/orange)
  - **Line chart**: Score trends over time (last 30 days, daily averages, one line per metric)
  - **Distribution chart**: Bar chart showing score distribution buckets (0.0-0.2, 0.2-0.4, etc.) per metric
  - **Recent evaluations table**: Sortable table of recent interactions with individual scores, expandable to see full question/answer/contexts
  - **Benchmark section**: Test case management + trigger benchmark + results display
- Configuration controls:
  - Evaluation sampling rate slider (e.g., "Evaluate 1 in N interactions")
  - Enable/disable evaluation toggle
- Add `evaluationEnabled (Boolean, default=false)` and `evaluationSampleRate (INT, default=5)` to `AiConfiguration`

---

## Files Summary

### Backend — Modify
- `pom.xml` — add pgvector/hibernate-vector, WebClient dependencies
- `application.yaml` — OpenAI embedding config, async executor config
- `AiChatService.java` — add streaming method, integrate PromptAssemblyService
- `AiChatController.java` — add `/chat/stream` SSE endpoint
- `Note.java` — add tags, linkedFeature, linkedEntityId fields
- `AiConfiguration.java` — add insightsEnabled, insightsCron, evaluationEnabled, evaluationSampleRate
- `NoteService.java` — publish embedding events, handle tags
- `GoalService.java` — publish embedding events, log activity
- `HabitService.java` — log activity (streaks, completions)
- `GymService.java` — log activity
- `TransactionService.java` — log activity

### Backend — Create New
- `db/migration/V16__create_user_profile_table.sql`
- `db/migration/V17__create_embeddings_table.sql`
- `db/migration/V18__create_activity_log_table.sql`
- `db/migration/V19__add_note_tags.sql`
- `db/migration/V20__create_rag_evaluation_tables.sql`
- `db/migration/V21__create_conversation_memories_table.sql`
- `entity/UserProfile.java`, `entity/Embedding.java`, `entity/ActivityLog.java`, `entity/RagEvaluation.java`, `entity/RagTestCase.java`, `entity/ConversationMemory.java`
- `repository/UserProfileRepository.java`, `repository/EmbeddingRepository.java`, `repository/ActivityLogRepository.java`, `repository/RagEvaluationRepository.java`, `repository/RagTestCaseRepository.java`, `repository/ConversationMemoryRepository.java`
- `service/UserProfileService.java`, `service/EmbeddingService.java`, `service/ActivityLogService.java`
- `service/OpenAiEmbeddingClient.java`, `service/StructuredContextService.java`, `service/PromptAssemblyService.java`
- `service/InsightGeneratorService.java`, `service/RagEvaluationService.java`, `service/ConversationMemoryService.java`
- `controller/UserProfileController.java`, `controller/RagEvaluationController.java`, `controller/ConversationMemoryController.java`
- `event/NoteUpdatedEvent.java`, `event/GoalUpdatedEvent.java`, `event/UserProfileUpdatedEvent.java`, `event/RagResponseCompletedEvent.java`
- `event/EmbeddingEventListener.java`, `event/RagEvaluationListener.java`, `event/ConversationMemoryListener.java`
- DTOs for UserProfile, ActivityLog, RagEvaluation, streaming responses

### Frontend — Modify
- `src/app/ai-chat/page.tsx` — SSE streaming consumer, updated message rendering
- `src/services/ai-chat.service.ts` — add `sendMessageStream()`
- `src/app/profile/page.tsx` — extended profile form (identity data)
- `src/services/user.service.ts` — add profile CRUD endpoints
- `src/types/index.ts` — UserProfile type, Note tags, ActivityLog type, RagEvaluation types, ConversationMemory type
- Notes pages — tag selector in create/edit forms
- Admin panel navigation — add RAG Evaluation link

### Frontend — Create New
- `src/app/admin/rag-evaluation/page.tsx` — RAGAS dashboard (4 metric stat cards with colored bars, line chart for trends, evaluation table, benchmark management)
- `src/services/rag-evaluation.service.ts` — API calls for evaluation endpoints

---

## Verification Checklist

1. **pgvector**: Run `SELECT * FROM pg_extension WHERE extname = 'vector';` — confirms extension installed
2. **Embedding pipeline**: Create a note, verify a row appears in `embeddings` table with non-null vector. Check `content_hash` matches SHA-256 of the note text. Update the note — verify embedding row updates (not duplicates)
3. **Vector search**: Create 5+ notes with varied topics. Query via `/api/ai/chat/stream` with a related topic. Verify the AI response references relevant note content
4. **Structured context**: Ask the AI "what are my active goals?" — verify it returns actual goal data, not a generic response
5. **Streaming**: Open browser DevTools Network tab. Send a chat message. Verify SSE events arrive incrementally (not one big response)
6. **Activity feed**: Complete a habit, check `activity_log` table has a new row. Then ask AI "what did I do today?" — verify it mentions the habit
7. **Note tagging**: Create a note tagged "journal". Ask AI a philosophical question — verify the journal note surfaces in vector results
8. **Proactive insights**: Trigger the insight job manually (or wait for schedule). Verify push notification received with a relevant, personalized insight message
9. **Profile context**: Set age/occupation in profile. Ask AI "tell me about myself" — verify it uses profile data
10. **Fallback**: Disable streaming in frontend, verify non-streaming endpoint still works
15. **Conversation memory — extraction**: Have a chat where you say "I just started learning piano" and "I sleep at 11pm usually". Check `conversation_memories` table — verify 2 active memories extracted
16. **Conversation memory — dedup**: In a new chat say "I sleep at midnight now". Verify the old sleep memory is marked `active=false, superseded_by=new_id` and new one is active
17. **Conversation memory — context**: Start a fresh chat and ask "what do you know about me?" — verify it mentions piano and sleep schedule from previous conversations
18. **Conversation memory — user control**: Call `GET /api/memories` — verify list of active memories. Delete one via `DELETE /api/memories/{id}`, confirm it no longer appears in AI context
11. **RAGAS — per-interaction**: Send a chat message, wait ~30s, query `rag_evaluations` table — verify Faithfulness, Answer Relevancy, Context Precision scores exist (0.0-1.0 range)
12. **RAGAS — dashboard**: Open `/admin/rag-evaluation`, verify 4 metric cards display with colored bars, line chart shows trend data
13. **RAGAS — benchmark**: Add 3 test cases via admin, trigger benchmark run, verify all 4 metrics (including Context Recall) return scores
14. **RAGAS — sampling**: Set sample rate to 2, send 10 messages, verify ~5 evaluations created (not 10)

---

## Decisions

- **Credentials/passwords**: EXCLUDED from AI context entirely (security boundary — good interview talking point)
- **Embedding model**: OpenAI `text-embedding-3-small` (1536 dims, ~$0.02/1M tokens) — stored API key already exists in `AiConfiguration.apiKeys`
- **Vector DB**: pgvector in existing PostgreSQL (no external vector service — simpler infra, easier to demo)
- **Vector index**: IVFFlat (more than sufficient at personal-project scale)
- **Embedding trigger**: Real-time async on save via Spring `@Async` events — simple, always fresh
- **Content that gets embedded**: Notes (all types), Goal descriptions+motives, GoalNotes content, UserProfile philosophy/bio/motto, conversation-extracted memories
- **Content NOT embedded**: Structured data (habits, transactions, gym numbers) — these use SQL queries, not vector search. Explain this hybrid approach in interviews: "exact data via SQL, fuzzy context via vectors"
- **Streaming protocol**: Server-Sent Events (SSE) — natively supported by Spring MVC (`SseEmitter`) and browser `fetch` ReadableStream
- **Activity feed**: Full history stored, last 10 entries injected into AI context, older entries available via vector search on summaries
- **Proactive insights**: Daily scheduled job at 8 PM, admin-configurable
- **RAGAS implementation**: LLM-as-judge in Java (no Python sidecar needed) — same configured LLM evaluates its own pipeline quality. Shows you can implement ML evaluation patterns without relying on a library
- **RAGAS live metrics**: Faithfulness + Answer Relevancy + Context Precision per-interaction (no ground truth needed)
- **RAGAS benchmark**: Context Recall requires ground truth — only available via curated test cases
- **RAGAS evaluation rate**: Default: evaluate every interaction (small personal project, cost is minimal)
- **Token budget**: ~4500 tokens for context (profile ~500, structured ~2000, conversation memories ~500, vector ~1500), leaving ~3500 for conversation + response
- **Conversation memory extraction**: LLM-based fact extraction after each multi-turn chat, with dedup via vector similarity and supersession tracking
- **Memory transparency**: View and delete what the AI remembers — demonstrates thoughtful UX design

---

## Interview & Demo Highlights

Key things to walk through when showing the project:

1. **Hybrid RAG architecture** — "We use SQL for exact structured data and pgvector cosine similarity for fuzzy semantic search, then stitch both into a single context window. This is the same pattern production RAG systems use."
2. **Event-driven embedding pipeline** — "When you save a note, a Spring async event fires, calls OpenAI's embedding API, and stores the vector. The content hash prevents redundant API calls on re-saves."
3. **Conversation memory with supersession** — "The AI extracts facts from conversations, deduplicates them with vector similarity, and handles contradictions — if you say 'I sleep at midnight' after previously saying '11pm', the old memory gets superseded."
4. **RAGAS evaluation without Python** — "We implemented the 4 RAGAS metrics natively in Java using LLM-as-judge prompts. The dashboard shows real-time pipeline quality — Faithfulness, Answer Relevancy, Context Precision, Context Recall."
5. **Proactive push insights** — "A scheduled job analyzes your life data, detects patterns like streak breaks or approaching deadlines, generates a motivational message via LLM, and sends it as a push notification."
6. **Full-stack SSE streaming** — "Token-by-token streaming from LLM → Spring SseEmitter → browser ReadableStream → real-time UI rendering."
7. **Cross-feature data graph** — "The AI knows your goals, habits, gym progress, spending, and schedule simultaneously. Ask it 'how am I doing this week?' and it pulls from 6 different data sources."

## Further Considerations

1. **Batch reindex for existing data** — When first deploying, existing notes/goals won't have embeddings. Add `POST /api/admin/embeddings/reindex` endpoint that processes all existing content.
2. **Context relevance scaling** — As data grows, structured context may exceed token budget. Future improvement: topic-detect the query and prioritize relevant structured sections (fitness question → prioritize gym data over finance).
3. **RAGAS baseline** — Seed 10-20 test cases during initial setup to establish Context Recall baseline. Categories should cover each feature area (fitness, finance, goals, philosophy).
4. **Demo seeding** — Create a script or admin endpoint to populate realistic sample data (notes, habits, goals, transactions) so the project looks impressive during live demos instead of empty.
