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

## ✅ Checkpoint 2: Profile Context — COMPLETE (Backend), PENDING (Frontend UI)

Goal: add one deterministic context source — dynamic profile extracted from user data and AI conversations.

What was built:
- `V24__enhance_user_profiles_dynamic.sql` — adds `profile_completeness`, `last_enriched_at`, `enrichment_sources`, `pending_questions`, `life_summary` to `user_profiles`.
- `UserProfile.java` — entity updated with V24 fields.
- `UserProfileService` — `buildProfileContext()`, `gatherEnrichmentContext()`, `applyEnrichment()`, `generatePendingQuestions()`, `calculateCompleteness()` (7-field scoring).
- `UserProfileController` — `GET/PUT /api/profile`, `GET /api/profile/pending-questions`.
- Two AI modes: `normal` (personality + profile context injected) and `chat_buddy` (warm interviewer persona, one pending question at a time).
- `AiChatRequest` — added `mode` field.

Still needed:
- Profile card UI in the profile/settings page showing completeness % and known fields.

## Checkpoint 3: Structured Snapshot

Goal: expand deterministic context across product features.

Scope:
- Add `StructuredContextService`.
- Inject habits, goals, gym, finance, schedule, and recent activity.
- Still no vector retrieval.

Definition of done:
- AI answers exact questions from database state.
- Output is grounded in current app data, not generic advice.

Verification:
- Ask: "What are my active goals?"
- Ask: "What did I do today?"

## Checkpoint 4: Vector Search

Goal: add semantic retrieval after exact context is stable.

Scope:
- Enable `pgvector` extension (already enabled — V15_1 migration).
- Embeddings table already exists (V17 migration, IVFFlat index).
- Wire `EmbeddingService` + `OpenAiEmbeddingClient` (scaffolded, not yet wired to chat).
- Embed notes, goals, and profile narrative fields.
- Inject top matching semantic results into the prompt.

Definition of done:
- Related notes are retrieved for semantically similar prompts.
- Re-embedding is skipped when content is unchanged.

Verification:
- Create notes on different topics.
- Ask about one topic and verify relevant note retrieval.

## Checkpoint 5: Conversation Memory

Goal: let the system retain user-stated facts across chats.

Scope:
- Add conversation memory extraction.
- Store active memories.
- Add dedup and supersession logic.
- Inject active memories into context.

Definition of done:
- Facts from previous chats reappear in later answers.
- Updated facts supersede old ones.

Verification:
- Tell the AI a new life fact.
- Start a fresh chat and ask what it remembers.

## Checkpoint 6: Activity Intelligence

Goal: build cross-feature meaning, not just retrieval.

Scope:
- Add `activity_log`.
- Publish major product actions into the activity timeline.
- Make the AI reference recent behavior.

Definition of done:
- The AI can summarize recent user activity across features.

Verification:
- Complete a habit or workout.
- Ask the AI what happened today.

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
| 2 | Profile Context | ✅ Backend done · ⏳ Frontend UI pending |
| 3 | Structured Snapshot | ⬜ Not started |
| 4 | Vector Search | ⬜ Not started (infra ready) |
| 5 | Conversation Memory | ⬜ Not started |
| 6 | Activity Intelligence | ⬜ Not started |
| 7 | Proactive Insights | ⬜ Not started |
| 8 | RAG Evaluation | ⬜ Not started |

Do not start vector retrieval before plain chat and streaming are stable.
Do not start evaluation before the retrieval pipeline is stable.
