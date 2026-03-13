# AI Build Checkpoints

This project should be built in checkpoints, not as one large RAG drop.

The rule is simple:
Start with plain chat that works reliably with no attachments, no retrieval, and no hidden context assembly.
Then add one capability at a time and verify it before moving on.

## ✅ Checkpoint 0: Plain AI Chat — COMPLETE

Goal: prove the provider integration works end to end.

Scope:
- `POST /api/ai/chat` endpoint.
- Request body contains `messages`, `personality`, optional `model`.
- Multi-provider: openrouter (default), openai, gemini — resolved from `ai_configuration` DB table.
- No attachments, no vector search, no streaming.

What was built:
- `AiChatService` — multi-provider dispatch via `RestTemplate`.
- `AiChatController` — single blocking endpoint.
- `AiConfigurationResolver` — resolves provider/model/keys from DB.
- Frontend AI chat page with 3 personality modes (Casual Buddy, Personal Mentor, Professional Assistant), session management, localStorage persistence.

## ✅ Checkpoint 1: Streaming — COMPLETE

Goal: make chat feel real-time before adding retrieval.

What was built:
- `POST /api/ai/chat/stream` — `SseEmitter`-based endpoint on Spring Boot.
- `streamOpenAiCompatible()` + `streamGemini()` — WebClient `bodyToFlux(ServerSentEvent<String>)` parsing for all three providers.
- `SecurityConfig` — `ASYNC`/`ERROR` dispatcher types permitted so Tomcat async re-dispatch doesn't get blocked by Spring Security.
- Newline encoding: backend encodes `\n` as `\\n` in SSE frames; frontend decodes back before render.
- `src/app/api/ai/chat/stream/route.ts` — Next.js proxy that pipes the SSE `ReadableStream` to the browser.
- `src/app/api/health/route.ts` — Next.js proxy for `/health` (fixes direct-call CORS).
- Frontend `sendMessage()` rebuilt: inserts AI placeholder immediately, appends tokens in real-time, mode toggle (Normal / Chat Buddy) visible in header and input bar.
- `MarkdownRenderer.tsx` — full rewrite: line-by-line parser, proper `<ul>`/`<ol>` wrapping, numbered lists, non-greedy bold/italic, code block escaping.

## ✅ Checkpoint 2: Profile Context — COMPLETE

Goal: add one deterministic context source — dynamic profile extracted from user data and AI conversations.

What was built:
- `V24__enhance_user_profiles_dynamic.sql` — adds `profile_completeness`, `last_enriched_at`, `enrichment_sources`, `pending_questions`, `life_summary` to `user_profiles`.
- `UserProfile.java` — entity updated with V24 fields.
- `UserProfileService` — `buildProfileContext()`, `gatherEnrichmentContext()`, `applyEnrichment()`, `generatePendingQuestions()`, `calculateCompleteness()` (7-field scoring).
- `UserProfileController` — `GET/PUT /api/profile`, `GET /api/profile/pending-questions`.
- Two AI modes: `normal` (personality + profile context injected) and `chat_buddy` (warm interviewer persona, one pending question at a time).
- `AiChatRequest` — added `mode` field.
- Profile completeness UI in settings page.

## ✅ Checkpoint 3: Structured Snapshot — COMPLETE

Goal: expand deterministic context across product features.

What was built:
- `StructuredContextService` — `buildSnapshot()` covering habits (streak, last-7-day count), goals (active/completed), gym (recent workouts, protein), finance (monthly totals, budget), schedule (today's planner items), recent activity.
- `PromptAssemblyService` — stitches profile + snapshot + memories + vector results into one context block injected via `[CONTEXT]` into the system prompt.
- AI correctly answers "What are my active goals?" and "What did I do today?" from DB state.

## ✅ Checkpoint 4: Vector Search — COMPLETE

Goal: add semantic retrieval after exact context is stable.

What was built:
- `EmbeddingTriggerEvent` + `EmbeddingEventListener` — `@Async @TransactionalEventListener(AFTER_COMMIT)` wired to NoteService and GoalService.
- `EmbeddingService` — embeds content via OpenAI, stores in pgvector `vector(1536)`, skips when content-hash unchanged.
- Bug fix: `EmbeddingRepository.findSimilar` changed param from `float[]` to `String` with `::vector` cast to match pgvector wire format.
- `EmbeddingBackfillService` — admin-triggered async backfill for all existing notes and goals.
- `POST /api/admin/backfill-embeddings` — admin-only backfill endpoint.
- `PromptAssemblyService` — injects top-5 semantically similar notes/goals under `=== RELEVANT NOTES & GOALS ===`.

## ✅ Checkpoint 5: Conversation Memory — COMPLETE

Goal: let the system retain user-stated facts across chats.

What was built:
- `MemoryExtractionService` — `@Async` extraction after every Chat Buddy response; builds extraction prompt with existing memories context; calls gpt-4o-mini for JSON extraction; category-level replace (deactivate old → save new per category).
- Memory categories: `personal | goals | health | work | relationships | preferences | context`.
- `ConversationMemoryRepository` — added `findByUserUidAndActiveTrueOrderByCreatedAtAsc` and `deactivateByUserUidAndCategory` (@Modifying JPQL).
- Profile enrichment: `MemoryExtractionService.enrichProfileFromChunks()` extracts age via regex from `personal` memories, occupation from first `work` memory, and calls `UserProfileService.updateProfile()`.
- `GET /api/ai/memories` + `DELETE /api/ai/memories/{id}` — memory viewer endpoints in `AiChatController`.
- Frontend memory viewer page at `/ai-chat/memories` — grouped by category with colored badges, per-item soft-delete, empty state.
- Brain icon link from AI chat header → memories page.

## ✅ Checkpoint 6: Activity Intelligence — COMPLETE

Goal: build cross-feature meaning, not just retrieval.

What was built:
- `ActivityLogService` + `activity_logs` table (V18 migration) — already existed.
- Wired `ActivityLogService` into all major domain services:
  - `HabitService` — logs habit created (`habits/created`), habit checked in for today (`habits/completed`).
  - `GoalService` — logs goal created, completed (completedAt transition), archived, deleted.
  - `GymService` — logs workout completed for date (`gym/workout_completed`), protein intake logged (`gym/protein_logged`).
  - `NoteService` — logs note created.
  - `TodoService` — logs todo completed (`todos/completed`); also fixed duplicate `delete()` call bug.
  - `TransactionService` — logs every new transaction (`finance/logged`) with type, description, and amount.
- `StructuredContextService.appendRecentActivity()` already reads the 10 most recent `ActivityLog` entries and injects them into the AI context under `=== RECENT ACTIVITY ===`.
- AI now references recent behavior across habits, goals, gym, todos, notes, and finance.

Verification:
- Complete a habit or log a workout → ask "What did I do today?" → AI references the activity.

## Checkpoint 7: Proactive Insights

Goal: move from reactive assistant to proactive assistant.

Scope:
- Add scheduled insight generation.
- Detect meaningful patterns.
- Send push notifications.

Definition of done:
- Insights are relevant and bounded.
- Notification delivery works through the existing pipeline.

Verification:
- Trigger the job manually.
- Confirm a useful push is created.

## Checkpoint 8: RAG Evaluation

Goal: measure quality once the pipeline is stable.

Scope:
- Add evaluation tables.
- Add faithfulness, answer relevancy, and context precision after each response.
- Add benchmark-driven context recall.
- Add admin dashboard.

Definition of done:
- Scores are stored and visible.
- Benchmark runs are reproducible.

Verification:
- Send messages and confirm evaluations are written.
- Run benchmark and inspect dashboard output.

## Build Order

| # | Checkpoint | Status |
|---|---|---|
| 0 | Plain AI Chat | ✅ Complete |
| 1 | Streaming | ✅ Complete |
| 2 | Profile Context | ✅ Complete |
| 3 | Structured Snapshot | ✅ Complete |
| 4 | Vector Search | ✅ Complete |
| 5 | Conversation Memory | ✅ Complete |
| 6 | Activity Intelligence | ✅ Complete |
| 7 | Proactive Insights | ⬜ Not started |
| 8 | RAG Evaluation | ⬜ Not started |

Do not start vector retrieval before plain chat and streaming are stable.
Do not start evaluation before the retrieval pipeline is stable.
