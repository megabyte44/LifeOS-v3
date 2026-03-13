# Plan: LifeOS Second Brain — RAG AI Integration + RAGAS Evaluation

> **Project context**: LifeOS is a **personal/portfolio group project** — built to showcase to interviewers and friends. Not a multi-user SaaS. The goal is demonstrating deep technical competence: hybrid RAG pipelines, real-time streaming, event-driven architecture, LLM-as-judge evaluation, and a polished full-stack experience. Every feature should be **demo-ready** and explainable in an interview.
>
> **Current date**: March 10, 2026
>
> **Follow the checkpoint order in `docs/AI_CHECKPOINTS.md` strictly.** Do not start the next checkpoint until the current one is verified working.

Transform the existing AI chat proxy into a context-aware **"Second Brain"** using pgvector semantic search + SQL structured queries, SSE streaming, proactive push insights, and **RAGAS evaluation metrics** to measure pipeline quality.

---

## Current Build State

### ✅ Done — Infrastructure & Scaffolding

All database migrations exist and are applied:
- V15_1: pgvector extension enabled
- V16: `user_profiles` table
- V17: `embeddings` table (vector(1536) + IVFFlat index)
- V18: `activity_log` table
- V19: note tags fields
- V21: `conversation_memories` table
- V22: AI config RAG columns
- V23: `rag_evaluations` + `rag_test_cases` tables

All JPA entities exist: `UserProfile`, `Embedding`, `ActivityLog`, `ConversationMemory`, `RagEvaluation`, `RagTestCase`

All Spring Data repositories exist for every entity above.

Services partially scaffolded: `EmbeddingService.java`, `OpenAiEmbeddingClient.java`, `ActivityLogService.java`

**Checkpoint 0 (Plain AI Chat) — COMPLETE.**
- `AiChatController` → `POST /api/ai/chat` works end-to-end.
- Multi-provider support (OpenRouter, OpenAI, Gemini) via `AiConfigurationResolver`.
- Personality-based system prompts from `AiConfiguration.systemInstructions`.

### ❌ Not Yet Built — Active Work Queue

The following are missing and must be built in checkpoint order:

| Checkpoint | What's missing |
|---|---|
| **1 — Streaming** | `POST /api/ai/chat/stream` SSE endpoint; frontend SSE consumer |
| **2 — Profile Context** | ✅ DONE — `UserProfileService`, `UserProfileController`, two AI modes (`normal` / `chat_buddy`), profile injected into `AiChatService` prompt |
| **3 — Structured Snapshot** | `StructuredContextService`, `PromptAssemblyService`; wire into chat |
| **4 — Vector Search** | `EmbeddingEventListener` (Spring async events on Note/Goal save); `searchSimilar()` wired into `PromptAssemblyService` |
| **5 — Conversation Memory** | `ConversationMemoryService`, `ConversationMemoryController`, `ConversationMemoryListener` |
| **6 — Activity Intelligence** | Hook `ActivityLogService` into `HabitService`, `GoalService`, `GymService`, `TransactionService`, `TodoService` |
| **7 — Proactive Insights** | `InsightGeneratorService` (`@Scheduled`), push via `NotificationDispatchService` |
| **8 — RAG Evaluation** | `RagEvaluationService`, `RagEvaluationController`, `RagEvaluationListener`, admin dashboard page |

---

---

## Target Architecture (Final State)

```
User Message (Next.js chat UI)
    │
    ├── mode: "normal"  ─── personality-based system prompt
    ├── mode: "chat_buddy" ─ interviewer prompt + pending questions
    │
    ▼
POST /api/ai/chat/stream (SSE)  ← NEXT TO BUILD (Checkpoint 1)
    │
    ├──► buildSystemPrompt(mode, userUid)   ← ✅ Checkpoint 2 DONE
    │       └──► UserProfileService.buildProfileContext()  (injected for all modes)
    │
    ├──► PromptAssemblyService              ← Checkpoint 3
    │       ├──► StructuredContextService (SQL)
    │       │     Profile, Habits, Goals, Gym, Finance, Schedule, ActivityLog
    │       ├──► EmbeddingService.searchSimilar() (pgvector cosine)  ← Checkpoint 4
    │       │     → Top 5 matching notes, goal descriptions, journals
    │       ├──► ConversationMemoryService (active memories)         ← Checkpoint 5
    │       └──► Assemble: system_prompt + context + conversation + message
    │
    ▼
LLM Provider (streaming) → SSE chunks → Frontend token rendering
    │
    ├──► @Async ProfileEnrichmentListener         ← Checkpoint 5
    │         Extract facts from conversation → applyEnrichment() → update profile
    │
    └──► @Async RagEvaluationListener             ← Checkpoint 8
              ├── Faithfulness, Answer Relevancy, Context Precision
              └── Store scores → rag_evaluations → Admin Dashboard

Background:
  @Scheduled InsightGeneratorService → detect patterns → LLM insight → push notification  ← Checkpoint 7
```

---

## NEXT: Immediate Work Queue (Checkpoints 1–3)

Implement in this exact order. Verify each checkpoint before moving to the next.

### ▶ CHECKPOINT 1 — Streaming SSE

**Goal**: Token-by-token streaming. No retrieval yet — prompt content stays identical to `/chat`.

**Backend**:
1. Add `WebClient` bean in `AppConfig.java` (for non-blocking HTTP streaming to LLM provider).
2. Add `POST /api/ai/chat/stream` in `AiChatController` returning `SseEmitter`.
3. Add `streamChat(AiChatRequest, SseEmitter)` method in `AiChatService`:
   - Same prompt assembly as `chat()` (system prompt + messages from request).
   - Use `WebClient` instead of `RestTemplate` to receive the streaming response from the provider.
   - For OpenRouter/OpenAI: set `"stream": true` in request body; parse `data:` SSE lines from provider, extract `choices[0].delta.content`, emit as `data: {"token":"..."}\n\n`.
   - For Gemini: use streaming REST endpoint; parse chunk JSON to extract text.
   - On stream end: emit `data: [DONE]\n\n` and complete the emitter.
   - On error: emit `data: {"error":"..."}\n\n` and complete with error.
4. Keep `POST /api/ai/chat` (non-streaming) fully working as fallback.

**Frontend**:
1. Add `sendMessageStream(req, onToken, onDone, onError)` in `src/services/ai-chat.service.ts`:
   - Uses `fetch()` + `ReadableStream` reader.
   - Calls `POST /api/ai/chat/stream`.
   - Calls `onToken(token)` for each `data:` chunk.
   - Calls `onDone()` on `[DONE]`.
2. Update `src/app/ai-chat/page.tsx`:
   - Replace the current blocking call with `sendMessageStream`.
   - Append each incoming token to the AI message bubble in real-time.
   - Show a blinking cursor/spinner while streaming.
   - Fallback: if `sendMessageStream` fails, retry with non-streaming `sendMessage`.

**Verification** (must pass before proceeding):
- Network tab shows incremental SSE chunks (not one large response).
- UI text appears word by word.
- Non-streaming `POST /api/ai/chat` still returns a complete response.

---

### ▶ CHECKPOINT 2 — Dynamic Profile Context + Two AI Modes — ✅ COMPLETE

**Goal**: Profile is built **dynamically** from LifeOS data + conversations, not a static form.

**Design — Dynamic Profile Building**:
The user profile is **extracted**, not manually filled. Three sources feed it:
1. **LifeOS data**: Notes, Goals, Habits → `UserProfileService.gatherEnrichmentContext()` collects raw material; LLM extracts bio/philosophy/interests from it.
2. **AI conversations**: When the user tells the AI something personal, `ConversationMemoryService` (Checkpoint 5) stores the fact, and a profile enrichment pass synthesizes it.
3. **Chat Buddy mode**: The AI proactively interviews the user to fill profile gaps.

**Implemented Files**:
- `V24__enhance_user_profiles_dynamic.sql` — adds `profile_completeness`, `last_enriched_at`, `enrichment_sources` (JSONB), `pending_questions` (JSONB), `life_summary` (TEXT).
- `UserProfile.java` — entity updated with new fields.
- `UserProfileService.java` — core service with:
  - `getOrCreate(userUid)` / `getProfile()` / `updateProfile()` — CRUD
  - `buildProfileContext(userUid)` — generates the natural-language context block injected into every AI prompt
  - `gatherEnrichmentContext(userUid)` — collects raw data from Notes, Goals, Habits, ConversationMemories for LLM extraction
  - `applyEnrichment(...)` — merges LLM-extracted fields (bio, philosophy, interests, lifeSummary) into the profile, tracks enrichment source counts
  - `generatePendingQuestions(userUid)` — inspects empty profile fields and generates targeted questions for Chat Buddy
  - `calculateCompleteness()` — 0–100 score based on 7 key fields
- `UserProfileController.java` — `GET /api/profile`, `PUT /api/profile`, `GET /api/profile/pending-questions`
- `UpdateUserProfileRequest.java`, `UserProfileDetailResponse.java` — DTOs

**Two AI Modes** (in `AiChatRequest.mode`):
| Mode | System Prompt | Behavior |
|------|--------------|----------|
| `normal` (default) | Personality-based (casual/professional) + profile context | Standard AI assistant |
| `chat_buddy` | Warm interviewer prompt + what's known + pending questions | Proactively asks ONE question at a time, reacts naturally, explores topics to fill profile gaps |

**How Chat Buddy works**:
- `AiChatService.buildChatBuddyPrompt(userUid)` constructs a system prompt that:
  - Sets the AI persona as a "warm, curious friend"
  - Injects `=== WHAT YOU ALREADY KNOW ===` (existing profile data)
  - Injects `=== TOPICS TO EXPLORE ===` (from `generatePendingQuestions`)
  - Rules: ask ONE question at a time, don't be a survey bot, react naturally, mix get-to-know-you with life check-ins
- Profile context is injected for **both** modes.

**Health fields** (sleep, calories, protein): Still in the schema but deprioritized — not part of Chat Buddy's question flow, not included in `calculateCompleteness()`. Available for manual setting via `PUT /api/profile` if the user wants.

**Frontend work remaining**:
1. Add mode toggle (Normal / Chat Buddy) to `ai-chat/page.tsx` — send `mode: "chat_buddy"` in request.
2. Add "AI Profile" read-only card in profile/settings page showing what the AI knows (bio, philosophy, interests, completeness %).
3. Add `UserProfile` type to `src/types/index.ts`.
4. Add `getProfile()` / `updateProfile()` in `src/services/user.service.ts`.

**Verification**:
- Chat in `normal` mode → AI has profile context if available.
- Switch to `chat_buddy` mode → AI greets warmly and asks a natural getting-to-know-you question.
- After several buddy conversations → profile fields gradually populate.
- `GET /api/profile` shows `profileCompleteness` increasing over time.

---

---

## Phase 1: Database & Embedding Foundation — ✅ COMPLETE

All migrations applied. All entities and repositories exist. No action required here.

| Step | What | Migration | Status |
|------|------|-----------|--------|
| 1.1 | pgvector extension, hibernate-vector in pom.xml | V15_1 | ✅ Done |
| 1.2 | **UserProfile** table | V16 | ✅ Done |
| 1.3 | **Embeddings** table (vector(1536), IVFFlat) | V17 | ✅ Done |
| 1.4 | **ActivityLog** table | V18 | ✅ Done |
| 1.5 | **Note tagging** fields | V19 | ✅ Done |
| 1.6 | **ConversationMemories** table | V21 | ✅ Done |
| 1.7 | **RagEvaluations + RagTestCases** tables | V23 | ✅ Done |
| 1.8 | **UserProfile dynamic enrichment** columns | V24 | ✅ Done |

---

## Phase 2: Embedding Pipeline — ⚠️ PARTIALLY DONE

| Step | What | Status |
|------|------|--------|
| 2.1 | `OpenAiEmbeddingClient` — calls `text-embedding-3-small`, returns `float[1536]` | ✅ Done |
| 2.2 | `EmbeddingService` — `embedAndStore()`, `searchSimilar()`, `deleteBySource()` | ✅ Done |
| 2.3 | Async events: `NoteUpdatedEvent`, `GoalUpdatedEvent` → `EmbeddingEventListener` | ❌ Build in Checkpoint 4 |
| 2.4 | **Conversation memory extraction** — LLM extracts user facts from chat → stores + embeds | ❌ Build in Checkpoint 5 |

**Embedded**: Notes text, Goal descriptions+motives, GoalNotes, UserProfile philosophy/bio/motto, extracted conversation memories
**NOT embedded**: Structured numbers (habits, transactions, gym stats) — those use SQL

### Step 2.3 — Async Embedding on Save (Checkpoint 4)
- Use Spring `@Async` + `@EventListener` pattern.
- Define domain events in `event/` package: `NoteUpdatedEvent`, `GoalUpdatedEvent`, `UserProfileUpdatedEvent`.
- Publish events from:
  - `NoteService.create/update` → `NoteUpdatedEvent(userUid, noteId, title + " " + flattenedContent)`
  - `GoalService.create/update` → `GoalUpdatedEvent(userUid, goalId, title + " " + motive + " " + description)`
  - `UserProfileService.update` → `UserProfileUpdatedEvent(userUid, profileId, philosophy + bio + lifeMotto)`
- `EmbeddingEventListener.java` handles all events `@Async`:
  - Calls `EmbeddingService.embedAndStore()` for each event.
  - On delete events: calls `EmbeddingService.deleteBySource()`.
- Requires `@EnableAsync` on a config class and an `AsyncTaskExecutor` bean.

### Step 2.4 — Conversation Memory Extraction (Checkpoint 5)
The second brain learns from what the user tells it. When a user says *"I just got promoted to senior engineer"*, that becomes a reusable memory.

**How it works:**
- After each RAG chat response completes (same `@Async` event hook), extract user-revealed facts.
- `ConversationMemoryService.java`:
  - Takes the user messages from the conversation (not AI responses).
  - Calls LLM with extraction prompt:
    ```
    Extract any personal facts, preferences, life updates, decisions, feelings,
    or insights the user revealed about themselves. Return as a JSON array of
    short statements. Return empty array if nothing notable.
    Examples: ["Got promoted to senior engineer", "Struggling with sleep this week"]
    ```
  - Each extracted statement:
    1. Stored in `conversation_memories` table.
    2. Embedded into `embeddings` with `source_type = "conversation_memory"`.

**Deduplication**:
- Before storing, vector-search existing memories for similarity > 0.92.
- If found: LLM judges if new fact updates the old (supersession) or is a duplicate (skip).
- If superseded: mark old as `active=false, superseded_by=new_id`.

**Memory endpoints** (`ConversationMemoryController.java`):
- `GET /api/memories` — list active memories.
- `DELETE /api/memories/{id}` — user-controlled deletion.

---

## Phase 3: Hybrid Context Assembly — ❌ CHECKPOINT 3

| Step | What | Status |
|------|------|--------|
| 3.1 | `StructuredContextService` — SQL snapshot (~2000 tokens) | ❌ Build in Checkpoint 3 |
| 3.2 | `PromptAssemblyService` — stitches all context sources; wire into `AiChatService` | ❌ Build in Checkpoint 3 |

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

## Phase 4: Streaming RAG Chat Endpoint — ❌ CHECKPOINT 1 (start here)

| Step | What | Status |
|------|------|--------|
| 4.1 | **Backend**: `POST /api/ai/chat/stream` → SSE. Keep `/chat` as fallback | ❌ Checkpoint 1 |
| 4.2 | **Frontend**: SSE consumer in ai-chat/page.tsx. Token-by-token rendering | ❌ Checkpoint 1 |
| 4.3 | **Profile page**: Extended form for identity data | ❌ Checkpoint 2 |

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

## Phase 5: Activity Feed & Cross-Feature Linking — ❌ CHECKPOINT 6

| Step | What | Status |
|------|------|--------|
| 5.1 | Hook `ActivityLogService` into HabitService, GoalService, GymService, TransactionService, TodoService | ❌ Checkpoint 6 |
| 5.2 | Note tagging UI — tag picker, feature linking, tag badges | ❌ Checkpoint 6 |

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

## Phase 6: Proactive AI Insights — ❌ CHECKPOINT 7

| Step | What | Status |
|------|------|--------|
| 6.1 | `InsightGeneratorService` — `@Scheduled` daily 8 PM, pattern detection, LLM message, push via `NotificationDispatchService` | ❌ Checkpoint 7 |

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

## Phase 7: RAGAS Evaluation Metrics — ❌ CHECKPOINT 8

This is the **quality measurement layer** — implements the 4 metrics using **LLM-as-judge** (no Python sidecar needed):

| Metric | Target Score | How It Works | Needs Ground Truth? | Status |
|--------|-------------|--------------|---------------------|--------|
| **Faithfulness** | ≥ 0.84 | Decompose answer into claims → verify each against retrieved context → `supported/total` | No | ❌ |
| **Answer Relevancy** | ≥ 0.79 | Generate hypothetical questions from answer → cosine similarity with original question | No | ❌ |
| **Context Precision** | ≥ 0.88 | LLM judges each retrieved chunk's relevance → `relevant/total` (rank-weighted) | No | ❌ |
| **Context Recall** | ≥ 0.76 | Check expected answer sentences against context → `attributable/total` | Yes (benchmark only) | ❌ |

> DB tables (`rag_evaluations`, `rag_test_cases`) exist from migration V23. Build services + endpoints + dashboard in Checkpoint 8.

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

### Backend — Already Exists (no changes needed unless noted)
- All DB migrations V16–V24 ✅
- All entities: `UserProfile` (updated with V24 fields), `Embedding`, `ActivityLog`, `ConversationMemory`, `RagEvaluation`, `RagTestCase` ✅
- All repositories for the above ✅
- `EmbeddingService.java`, `OpenAiEmbeddingClient.java`, `ActivityLogService.java` ✅ (scaffolded)
- `AiChatService.java` ✅ (updated: two modes `normal`/`chat_buddy`, profile context injection, `userUid` parameter)
- `AiChatController.java` ✅ (updated: passes `userUid` to service)
- `UserProfileService.java` ✅ (CRUD + `buildProfileContext` + `gatherEnrichmentContext` + `applyEnrichment` + `generatePendingQuestions`)
- `UserProfileController.java` ✅ (`GET /api/profile`, `PUT /api/profile`, `GET /api/profile/pending-questions`)
- `UpdateUserProfileRequest.java`, `UserProfileDetailResponse.java` ✅

### Backend — Modify (Checkpoints 1, 3+)
- `AppConfig.java` — add `WebClient` bean (Checkpoint 1)
- `AiChatService.java` — add `streamChat()` method (Checkpoint 1), integrate `PromptAssemblyService` (Checkpoint 3)
- `AiChatController.java` — add `POST /api/ai/chat/stream` SSE endpoint (Checkpoint 1)
- `NoteService.java` — publish `NoteUpdatedEvent`, handle tags (Checkpoint 4)
- `GoalService.java` — publish `GoalUpdatedEvent`, log activity (Checkpoints 4, 6)
- `HabitService.java` — log activity (streaks, completions) (Checkpoint 6)
- `GymService.java` — log activity (Checkpoint 6)
- `TransactionService.java` — log activity (Checkpoint 6)

### Backend — Create New
- `service/StructuredContextService.java` (Checkpoint 3)
- `service/PromptAssemblyService.java` (Checkpoint 3)
- `event/NoteUpdatedEvent.java`, `event/GoalUpdatedEvent.java`, `event/UserProfileUpdatedEvent.java` (Checkpoint 4)
- `event/EmbeddingEventListener.java` (Checkpoint 4)
- `service/ConversationMemoryService.java` (Checkpoint 5)
- `controller/ConversationMemoryController.java` (Checkpoint 5)
- `event/ConversationMemoryListener.java` (Checkpoint 5)
- `event/RagResponseCompletedEvent.java` (Checkpoint 8)
- `service/InsightGeneratorService.java` (Checkpoint 7)
- `service/RagEvaluationService.java` (Checkpoint 8)
- `controller/RagEvaluationController.java` (Checkpoint 8)
- `event/RagEvaluationListener.java` (Checkpoint 8)
- DTOs for streaming responses, RagEvaluation

### Frontend — Modify
- `src/app/ai-chat/page.tsx` — SSE streaming consumer + mode toggle (Normal / Chat Buddy) (Checkpoints 1, 2)
- `src/services/ai-chat.service.ts` — add `sendMessageStream()`, send `mode` field (Checkpoint 1)
- `src/app/profile/page.tsx` — read-only "AI Profile" card showing what AI knows + completeness % (Checkpoint 2)
- `src/services/user.service.ts` — add `getProfile()` / `updateProfile()` (Checkpoint 2)
- `src/types/index.ts` — `UserProfile`, note tags, `ActivityLog`, `RagEvaluation`, `ConversationMemory` types
- Notes pages — tag selector in create/edit forms (Checkpoint 6)
- Admin panel navigation — add RAG Evaluation link (Checkpoint 8)

### Frontend — Create New
- `src/app/admin/rag-evaluation/page.tsx` — RAGAS dashboard (Checkpoint 8)
- `src/services/rag-evaluation.service.ts` (Checkpoint 8)

---

## Verification Checklist

### Checkpoint 1 — Streaming
1. Network tab shows incremental SSE chunks (not one large response).
2. UI text appears word-by-word in the chat bubble.
3. `POST /api/ai/chat` (non-streaming fallback) still works.

### Checkpoint 2 — Profile Context + Chat Buddy
4. `GET /api/profile` → returns profile with `profileCompleteness`, `pendingQuestions`.
5. `PUT /api/profile` with age=25, occupation="Software Engineer" → fields saved.
6. Normal mode: ask AI "tell me about myself" → response mentions age and occupation from profile context.
7. Chat Buddy mode (`mode: "chat_buddy"`): AI greets warmly, asks ONE natural getting-to-know-you question.
8. After answering buddy questions → profile fields gradually populate (once Checkpoint 5 wires memory extraction).
9. Profile with no data → AI still responds normally in both modes (graceful null handling).

### Checkpoint 3 — Structured Snapshot
7. Ask AI "what are my active goals?" → returns actual goal names and progress from DB, not generic advice.
8. Ask AI "how am I doing this week?" → references habits, gym, finance from structured context.

### Checkpoint 4 — Vector Search
9. Create a note, check `embeddings` table has a new row with non-null vector. Verify `content_hash` matches SHA-256 of note text.
10. Update the note — verify embedding row updates (not duplicated).
11. Create 5+ notes on varied topics. Ask about one topic — verify AI response references the relevant note.

### Checkpoint 5 — Conversation Memory
12. Chat: say "I just started learning piano" and "I sleep at 11pm usually". Check `conversation_memories` table for 2 active rows.
13. New chat: say "I sleep at midnight now". Verify old sleep memory is `active=false, superseded_by=new_id`.
14. Fresh chat: ask "what do you know about me?" — response mentions piano and sleep schedule.
15. Call `GET /api/memories` — verify active memory list. Delete one via `DELETE /api/memories/{id}`, confirm it no longer appears in AI context.

### Checkpoint 6 — Activity Intelligence
16. Complete a habit, check `activity_log` table for a new row. Ask AI "what did I do today?" — mentions the habit.

### Checkpoint 7 — Proactive Insights
17. Trigger insight job manually. Confirm a push notification is created with a relevant, personalized message.

### Checkpoint 8 — RAGAS Evaluation
18. Send a chat message, wait ~30s. Query `rag_evaluations` table — verify Faithfulness, Answer Relevancy, Context Precision scores exist (0.0-1.0).
19. Open `/admin/rag-evaluation` — 4 metric cards, line chart trend, recent evaluations table visible.
20. Add 3 benchmark test cases, trigger benchmark run, verify all 4 metrics (including Context Recall) return scores.

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

1. **Two AI modes** — "Normal mode is a context-aware assistant. Chat Buddy mode flips the dynamic — the AI interviews you to build your profile over time. It tracks what it knows, what it doesn't, and naturally weaves questions into conversation."
2. **Dynamic profile building** — "The user profile isn't a form — it's synthesised from notes, goals, habits, and conversations. The AI extracts bio, philosophy, and interests from multiple data sources and tracks a completeness score."
3. **Hybrid RAG architecture** — "SQL for exact structured data, pgvector cosine similarity for fuzzy semantic search, stitched into a single context window. Same pattern as production RAG systems."
4. **Event-driven embedding pipeline** — "Save a note → Spring async event → OpenAI embedding API → pgvector store. Content hash prevents redundant API calls on re-saves."
5. **Conversation memory with supersession** — "The AI extracts facts from conversations, deduplicates with vector similarity, and handles contradictions via supersession chains."
6. **RAGAS evaluation without Python** — "4 RAGAS metrics natively in Java using LLM-as-judge prompts. Dashboard shows real-time pipeline quality."
7. **Proactive push insights** — "Scheduled job detects patterns (streak breaks, deadlines) → LLM generates motivational message → push notification."
8. **Full-stack SSE streaming** — "Token-by-token streaming: LLM → Spring SseEmitter → browser ReadableStream → real-time UI rendering."
9. **Cross-feature data graph** — "The AI knows goals, habits, gym progress, spending, and schedule simultaneously. Ask 'how am I doing this week?' and it pulls from 6+ data sources."

## Further Considerations

1. **Batch reindex for existing data** — When first deploying, existing notes/goals won't have embeddings. Add `POST /api/admin/embeddings/reindex` endpoint that processes all existing content.
2. **Context relevance scaling** — As data grows, structured context may exceed token budget. Future improvement: topic-detect the query and prioritize relevant structured sections (fitness question → prioritize gym data over finance).
3. **RAGAS baseline** — Seed 10-20 test cases during initial setup to establish Context Recall baseline. Categories should cover each feature area (fitness, finance, goals, philosophy).
4. **Demo seeding** — Create a script or admin endpoint to populate realistic sample data (notes, habits, goals, transactions) so the project looks impressive during live demos instead of empty.
