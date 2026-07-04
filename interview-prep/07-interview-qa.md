# 07 — Interview Q&A

Scripted answers for the most common questions. Adapt the length to the conversation — these are full answers you can trim on the fly.

---

## "Tell me about this project."

> LifeOS is a full-stack personal life-management platform I built with Spring Boot 4 on the backend and Next.js 16 on the frontend. The core idea is that your personal data — notes, habits, a daily planner, todos — should all live in one place and be queryable through an AI that actually knows your life.
>
> The technical centrepiece is a three-layer RAG pipeline. When you ask the AI something, it first runs a hybrid retrieval: BM25 keyword scoring combined with pgvector cosine similarity over extracted memory nodes and note embeddings. Second, it classifies your query's intent — habits, todos, schedule — and injects only the relevant SQL snapshot. Third, it pulls your user profile from a memory graph built from previous conversations. All of that context gets assembled by `PromptAssemblyService` and injected into the system prompt before the LLM sees your message.
>
> On top of that, there's a streaming SSE chat with two modes — a normal mode and a "Chat Buddy" mode that extracts versioned memory facts from every conversation and stores them as a knowledge graph.

---

## "Walk me through the architecture."

> The frontend is Next.js App Router. Every page has its own loading and error boundaries, and all server state goes through TanStack React Query. The `apiClient` wrapper in `api-client.ts` auto-injects the Firebase ID token and handles 401s by signing the user out and clearing the cache.
>
> Auth flows through `FirebaseAuthenticationFilter`, an `OncePerRequestFilter` that verifies the Bearer token with the Firebase Admin SDK, auto-creates the user in our Postgres database on first login, and sets a Spring Security authentication with either `ROLE_USER` or `ROLE_ADMIN` based on the DB record.
>
> The backend is a Spring Boot monolith using both MVC (for REST) and WebFlux (for streaming). Controllers are thin — they extract the user UID from `SecurityUtils.getCurrentUserUid()` and delegate to services. The service layer is where everything interesting happens: `AiChatService` handles provider routing and SSE streaming, `IngestionPipeline` handles chunking and embedding, and `MemoryExtractionService` runs async after every chat exchange to build the memory graph.
>
> Postgres with pgvector holds the embeddings as `float[]` columns managed by `hibernate-vector`. Flyway handles schema migrations. Docker Compose brings up Postgres locally.

---

## "What was the hardest problem you solved?"

> The hardest problem was building a retrieval system that actually surfaces the right context. Pure vector search kept missing obvious things — a user asking "what are my todos?" shouldn't rely on semantic similarity to find their to-do list. But pure keyword search misses semantic connections.
>
> The solution I landed on was a hybrid scoring formula in `MemoryRetrievalStrategyService`. I implemented BM25 from scratch — about 40 lines using the `tf*(k1+1)/(tf + k1*(1-b+b*(docLen/avgDocLen)))` formula — and combined it with pgvector cosine similarity at a 35% vector / 25% BM25 weight, with recency decay, importance, confidence, and access frequency making up the rest. I also added a dynamic token budget that scales based on query complexity — short, simple queries get a narrow window; long analytical queries get more context.
>
> The tricky part was knowing what NOT to include. Intent classification — a pure keyword classifier, no LLM call — routes queries so that a habit question doesn't inject your full todo list, and a schedule question doesn't pull your personal preferences. That's the difference between a prompt with 400 well-targeted tokens and one with 2000 noisy tokens that confuses the model.

---

## "How does your AI feature actually work under the hood?"

> The AI chat has two modes. In "normal" mode, the system assembles context from three layers and sends it as a hidden block in the system prompt — the user's profile, semantically relevant memories, and intent-matched structured data from the database.
>
> In "Chat Buddy" mode, after every streaming response completes, `MemoryExtractionService.extractAndStore()` fires asynchronously. It calls a small LLM (gpt-4o-mini, temperature 0.2) with a structured prompt that asks it to extract factual statements the user made about themselves, classify them by category (personal/goals/health/work/etc.), tag them as static or dynamic, set an expiry for temporal facts, and detect graph relations — whether the new fact *updates*, *extends*, or *derives from* an existing memory.
>
> The memories are stored as versioned graph nodes. If a user says they're 21 and previously I stored they were 20, the old node gets `isLatest=false` and a `MemoryRelationship` edge of type "updates" connects the two. Retrieval always queries `isLatest=true` so stale facts are automatically excluded.
>
> The streaming itself uses Spring WebFlux `WebClient` to call the LLM with `stream=true`, bridge through `SseEmitter` to the browser. The first SSE event is a `conversation_id` event so the frontend can wire up the sidebar before any tokens arrive.

---

## "What would you do differently if you rebuilt this?"

> Three things:
>
> First, I'd add a durable job queue for memory extraction from day one. Right now it's `@Async` with a Spring thread pool — works fine for a personal project, but a server restart loses in-progress tasks and there's no retry logic. SQS with a DLQ would be the right call.
>
> Second, I'd separate the AI configuration from the `AiConfiguration` entity. Right now it stores API keys in a JSONB column in Postgres. That works, but secrets in the DB is not ideal — they should be in a secrets manager (AWS Secrets Manager or Vault) with the DB storing only a reference.
>
> Third, the BM25 implementation doesn't use IDF (inverse document frequency) because the document corpus is per-user and small. At scale, the most common words across users ("I", "my", "the") aren't filtered well. A proper IDF pass or using PostgreSQL's built-in `tsvector` with GIN indexing would improve recall.

---

## "How did you handle testing?"

> [PLACEHOLDER — fill in based on your actual test suite. Example responses below:]
>
> **Option A (if you wrote tests):**
> I focused on unit tests for the core business logic — particularly `MemoryRetrievalStrategyService` (scoring formulas, BM25 calculation, dynamic cap computation) and `MemoryExtractionService` (graph relation handling, dedup hash logic). `AiConfigurationResolver` is well-covered since `isBlank()` (fan-in: 42) is a critical decision point that gates provider selection. Integration tests cover the auth filter flow — verifying that a valid Firebase token sets the correct `SecurityContext` and an invalid one returns 401.
>
> **Option B (if limited tests):**
> The current test coverage is minimal — mostly smoke tests for the Spring context load. If I continued the project, I'd prioritise unit tests for `MemoryRetrievalStrategyService` (the scoring weights are behavioural contracts that should be locked down), integration tests for `FirebaseAuthenticationFilter`, and contract tests for the LLM API calls using WireMock to avoid real API calls in CI.

---

## Rapid-Fire Answers

**Q: Why Spring Boot 4 and not 3?**  
A: Spring Boot 4 runs on Spring Framework 7, which brings better virtual thread support and Jakarta EE 11. For a new project, starting on the latest generation makes sense — no debt from the start.

**Q: Why Next.js and not a pure React SPA?**  
A: The admin pages and the AI chat needed server-side route handlers (SSE proxy, push subscription endpoints). Next.js route handlers (`app/api/`) gave me those without a separate Express server.

**Q: How do you handle concurrent users modifying the same memory graph?**  
A: Postgres transactions handle isolation. `@Transactional` on `extractAndStore()` means the dedup hash check and the insert are atomic per user. Memory nodes are keyed by user UID so there's no cross-user contention.

**Q: What's the `AiFoundationProperties` class?**  
A: It's a `@ConfigurationProperties(prefix="ai")` bean that maps all AI-related config from `application.properties` / `.env`. It has nested classes for `Rag`, `Embedding`, `Chunking`, `Streaming`, and `Async` settings. It acts as a runtime feature flag system — toggling `enableHybridReads` or `enableGraphBoostedScoring` changes retrieval behaviour without a deploy.

**Q: Why pgvector over a dedicated vector database?**  
A: The vectors live next to the source entities (notes, memories) in the same Postgres instance. Consistency, joins, and transactional deletes come for free. At LifeOS's scale, exact cosine search in pgvector is fast enough. I'd revisit this for millions of vectors per user.

**Q: What is `SecurityUtils.getCurrentUserUid()`?**  
A: It's the most-called method in the backend (fan-in: 50). It extracts the Firebase UID from `SecurityContextHolder.getContext().getAuthentication().getPrincipal()`. Every service method takes this UID as a parameter to ensure all queries are user-scoped — there's no way to accidentally return another user's data.

**Q: How does the PWA work?**  
A: `@ducanh2912/next-pwa` generates a Workbox service worker (`sw.js`) that pre-caches static assets. The `manifest.json` makes the app installable on mobile. Web Push uses VAPID keys — the frontend subscribes via `PushManager.subscribe()`, sends the subscription to `POST /push/subscribe` (stored in `PushSubscription` table), and the backend dispatches via `WebPushService` using the `nl.martijndwars:web-push` library.

**Q: Is there any soft delete?**  
A: Yes — `Note` and `TodoItem` have a `deleted` boolean field. The repository uses derived query methods like `findByIdAndDeletedFalse()` to exclude tombstoned records. Hard delete would break foreign key references from `Embedding` rows.

**Q: What's the difference between `chat` and `streamChat` in `AiChatService`?**  
A: `chat()` is a synchronous request-response (used when streaming is disabled). `streamChat()` uses WebFlux `WebClient` to subscribe to the LLM's streaming endpoint and bridges tokens to the browser via `SseEmitter`. The streaming path also sends a `conversation_id` SSE event first so the frontend can wire up the conversation immediately without waiting for the first token.
