# LifeOS "Second Brain" -- RAG Architecture & Flow

> Auto-generated architecture reference for the hybrid RAG pipeline powering LifeOS AI chat.

---

## 1. High-Level Architecture

```
+-------------------+         +----------------------------+        +------------------+
|   Next.js Chat    |  SSE    |   Spring Boot Backend      |        |   PostgreSQL 16  |
|   (ai-chat page)  | <-----> |   /api/ai/chat/stream      |        |   + pgvector     |
+-------------------+         +----------------------------+        +------------------+
                                        |                                    |
                              +---------+---------+              +-----------+-----------+
                              |                   |              |           |           |
                        Build System       Stream to LLM    embeddings  conversation  structured
                          Prompt          (OpenAI/OpenRouter   table     _memories     tables
                              |            /Gemini)              |        table       (habits,
                              |                   |              |           |        goals, gym,
                      +-------+-------+     +-----+-----+       |    +------+------+ finance,
                      |       |       |     |     |     |       |    |             | schedule)
                   Profile  SQL    Hybrid  SSE  Token  Done     |  Fact-level   Supersession
                   Context  Snap-  Retriev.      by            |  Versioning   Chains
                           shot   Strategy      Token          |
                                    |                          |
                              +-----+-----+                    |
                              |           |                    |
                          Memory      Vector           Cosine Similarity
                        Candidates  Candidates          (IVFFlat index)
                        (SQL fetch) (pgvector)
```

---

## 2. Data Flow -- End-to-End Chat Request

```
User types message in Next.js UI
         |
         v
POST /api/ai/chat/stream  (AiChatController)
         |
         v
AiChatService.streamChat()
         |
         +---> 1. Resolve mode ("normal" | "chat_buddy")
         |         -> Select base system prompt (personality vs interviewer)
         |
         +---> 2. PromptAssemblyService.buildFullSystemPrompt()
         |         |
         |         +---> UserProfileService.buildProfileContext()       [SQL]
         |         |       name, age, occupation, bio, philosophy, interests
         |         |
         |         +---> StructuredContextService.buildSnapshot()       [SQL]
         |         |       habits (streaks, 7-day rate)
         |         |       goals (title, progress%, target date)
         |         |       gym (workout count, protein intake)
         |         |       finance (spending vs budget, top categories)
         |         |       schedule (today's planner items, priority todos)
         |         |       activity (last 10 entries with relative timestamps)
         |         |
         |         +---> MemoryRetrievalStrategyService.buildPlan()     [HYBRID]
         |                 |
         |                 +---> Fetch 120 conversation memory candidates (SQL)
         |                 +---> Fetch 30 vector candidates (pgvector cosine search)
         |                 +---> Compute composite score per candidate
         |                 +---> Dynamic top-k with token budgeting
         |                 +---> Log to memory_retrieval_log (observability)
         |                 +---> Return RetrievalPlan (memoryLines + vectorLines)
         |
         +---> 3. Assemble prompt:
         |         [BASE SYSTEM PROMPT]
         |         [CONTEXT -- hidden from user]
         |            === USER PROFILE ===
         |            === HABITS / GOALS / GYM / FINANCE / SCHEDULE / ACTIVITY ===
         |            === WHAT I KNOW ABOUT YOU ===  (conversation memories)
         |            === RELEVANT NOTES & GOALS === (vector search results)
         |         [END CONTEXT]
         |
         +---> 4. Send to LLM provider (stream: true)
         |         OpenAI / OpenRouter / Gemini via WebClient
         |         SSE chunks -> SseEmitter -> frontend ReadableStream
         |
         +---> 5. @Async post-processing (Chat Buddy mode only)
                   MemoryExtractionService.extractAndStore()
                     -> LLM extracts facts as JSON
                     -> Dedup by SHA-256 hash + vector similarity
                     -> Store/supersede conversation memories
                     -> Embed new memories in pgvector
                     -> Auto-enrich user profile (age, occupation)
```

---

## 3. Embedding Pipeline

### 3.1 Ingestion Triggers (Event-Driven)

| Source | Trigger | Text Embedded | Service |
|--------|---------|---------------|---------|
| **Notes** | Create / Update / Delete | `title + "\n" + content` | `NoteService` publishes `EmbeddingTriggerEvent` |
| **Goals** | Create / Update / Delete | `title + "\n" + description + "\n" + motive` | `GoalService` publishes `EmbeddingTriggerEvent` |
| **Conversation Memories** | After LLM extraction | `memoryText` | `MemoryExtractionService` calls `embedAndStore()` directly |

### 3.2 Async Event Processing

```
NoteService.save()
     |
     +--> publishEvent(EmbeddingTriggerEvent(uid, "note", id, text))
                |
                v
     EmbeddingEventListener  (@Async @TransactionalEventListener AFTER_COMMIT)
                |
                v
     EmbeddingService.embedAndStore()
                |
                +---> Compute SHA-256 hash of text
                +---> Check existing embedding by (sourceType, sourceId)
                +---> If hash unchanged -> SKIP (deduplication)
                +---> Truncate text to 8000 chars
                +---> Call OpenAiEmbeddingClient.getEmbedding()
                |         -> text-embedding-3-small (1536 dimensions)
                |         -> POST to OpenAI/OpenRouter /v1/embeddings
                +---> Upsert into `embeddings` table with:
                        vector(1536), content_hash, content_preview (200 chars),
                        domain, quality_score, recency_weight, importance_signal
```

### 3.3 Batch Backfill

`POST /api/admin/backfill-embeddings` -> `EmbeddingBackfillService.backfillAll()`
- Iterates all users -> all notes + all goals
- Calls `embedAndStore()` for each
- SHA-256 dedup prevents redundant API calls

### 3.4 What Gets Embedded vs What Uses SQL

| Embedded (Semantic / Fuzzy) | SQL (Structured / Exact) |
|-----------------------------|--------------------------|
| Notes (all types) | Habit streaks & completion rates |
| Goal descriptions + motives | Goal progress percentages |
| Conversation memories (facts) | Gym stats (workout count, protein) |
| | Financial data (spending, budget) |
| | Schedule (planner items, todos) |
| | Activity log entries |

**Design rationale**: Exact numerical data is better served by SQL. Free-text, opinion, and contextual knowledge benefits from semantic vector search.

---

## 4. Retrieval Strategy -- Hybrid Ranking

### 4.1 Two Modes

| Mode | When | Behavior |
|------|------|----------|
| **Legacy** | `MEMORY_HYBRID_READS=false` | Top 50 memories by recency + top N vector results, simple concatenation |
| **Hybrid** | `MEMORY_HYBRID_READS=true` (default) | Multi-signal weighted scoring with dynamic top-k |

### 4.2 Hybrid Scoring Formula

**Conversation Memory Candidates:**
```
score = (0.35 * vectorScore)
      + (0.25 * structuredScore)
      + (0.15 * recencyScore)
      + (0.10 * importanceScore)
      + (0.10 * confidenceScore)
      + (0.05 * accessBoost)
```

**Embedding Candidates (notes/goals):**
```
score = (0.45 * vectorScore)
      + (0.20 * structuredScore)
      + (0.15 * recencyScore)
      + (0.10 * importanceScore)
      + (0.10 * confidenceScore)
```

### 4.3 Signal Definitions

| Signal | Computation | Range |
|--------|-------------|-------|
| **vectorScore** | `1 - cosine_distance` (pgvector `<=>` operator) | 0.0 - 1.0 |
| **structuredScore** | Keyword overlap: `matched_query_terms / total_query_terms` | 0.0 - 1.0 |
| **recencyScore** | Exponential decay: `exp(-ageDays / 30.0)` | 0.0 - 1.0 |
| **importanceScore** | `avg(relevanceScore, timelinessScore)` | 0.0 - 1.0 |
| **confidenceScore** | `overallConfidence` or `confidence` field, default 0.7 | 0.0 - 1.0 |
| **accessBoost** | `min(1.0, log1p(accessCount) / 3.0)` | 0.0 - 1.0 |

### 4.4 Dynamic Top-K & Token Budgeting

When `MEMORY_DYNAMIC_TOPK=true`:

```
Token Budget = base(1400) + min(500, queryTokens * 2)
               clamped to [900, 1900]

Dynamic Cap  = based on query complexity:
               simple (< 14 tokens):   14 candidates
               medium (14-30 tokens):  18 candidates
               complex (> 30 tokens):  22 candidates

Minimum K    = 6 (always selected regardless of budget)
```

**Selection algorithm:**
1. Sort all candidates by composite score (descending)
2. Add candidates in score order until token budget exhausted OR dynamic cap reached
3. If fewer than `minK` selected, force-add top-scored remaining candidates

### 4.5 Observability

Every retrieval call logs the top 40 ranked candidates to `memory_retrieval_log` with:
- Individual signal scores (vector, structured, recency, importance, confidence)
- Final composite ranking score
- Whether the candidate was selected
- Token estimate per candidate

Access counts on selected memories/embeddings are incremented via `touchAccess()` / `touchLastUsed()`.

---

## 5. Prompt Assembly -- Context Window Layout

```
+------------------------------------------------------------------+
| BASE SYSTEM PROMPT                                                |
| (personality-based or chat_buddy interviewer prompt)              |
+------------------------------------------------------------------+
| [CONTEXT -- use this to answer accurately, do not reveal ...]     |
|                                                                   |
| === USER PROFILE ===                                  (~500 tok)  |
| Name, age, occupation, bio, philosophy, interests                 |
|                                                                   |
| === HABITS ===                                                    |
| Habit names, streak counts, 7-day completion rates                |
|                                                                   |
| === ACTIVE GOALS ===                                  (~2000 tok  |
| Titles, categories, progress%, target dates                       |  total for
|                                                                   |  structured)
| === GYM ===                                                       |
| Workout count, protein intake vs target                           |
|                                                                   |
| === FINANCE (this month) ===                                      |
| Spending vs budget, top categories, income                        |
|                                                                   |
| === TODAY'S SCHEDULE ===                                          |
| Planner items, high-priority todos                                |
|                                                                   |
| === RECENT ACTIVITY ===                                           |
| Last 10 activity log entries with relative timestamps             |
|                                                                   |
| === WHAT I KNOW ABOUT YOU ===                         (~500 tok)  |
| Ranked conversation memories from hybrid retrieval                |
|                                                                   |
| === RELEVANT NOTES & GOALS ===                        (~1500 tok) |
| Vector-similar notes/goals from hybrid retrieval                  |
|                                                                   |
| [END CONTEXT]                                                     |
+------------------------------------------------------------------+
| CONVERSATION HISTORY (last N messages)                            |
+------------------------------------------------------------------+
| USER'S NEW MESSAGE                                                |
+------------------------------------------------------------------+
|                                                                   |
| Token budget: ~4500 for context, ~3500 for conversation+response  |
+------------------------------------------------------------------+
```

---

## 6. Conversation Memory Extraction & Lifecycle

### 6.1 Extraction Flow (Chat Buddy Mode)

```
Chat response completes
         |
         v
@Async MemoryExtractionService.extractAndStore()
         |
         +---> Send user messages to LLM with extraction prompt:
         |       "Extract personal facts, preferences, life updates..."
         |       -> Returns JSON array of short statements
         |
         +---> For each extracted fact:
         |       1. Compute SHA-256 memory_hash
         |       2. Check for existing memory with same hash -> SKIP if duplicate
         |       3. Store in conversation_memories with:
         |            domain, factuality/relevance/timeliness scores,
         |            overall_confidence, extraction_model
         |
         +---> Embed new memories:
         |       embeddingService.embedAndStore(uid, "conversation_memory", id, text)
         |
         +---> Profile auto-enrichment:
                 If fact mentions age/occupation -> update UserProfile fields
```

### 6.2 Memory Versioning & Supersession

```
User says: "I sleep at 11pm"     ->  Memory A created (active=true)
User says: "I sleep at midnight"  ->  Memory B created (active=true)
                                      Memory A: active=false, superseded_by=B.id
```

- Old facts are soft-deactivated, not deleted
- `memory_relationships` table tracks supersession/contradiction/refinement links
- Historical lineage preserved for auditing

### 6.3 Memory Transparency (User Control)

- `GET /api/ai/memories` -- list all active memories
- `DELETE /api/ai/memories/{id}` -- soft-deactivate a specific memory
- Memory viewer UI in the frontend chat page

---

## 7. Storage Layer

### 7.1 Vector Store: pgvector in PostgreSQL 16

| Aspect | Detail |
|--------|--------|
| **Extension** | `CREATE EXTENSION IF NOT EXISTS vector` (migration V15_1) |
| **Docker image** | `pgvector/pgvector:pg16` |
| **Cloud DB** | Neon.tech PostgreSQL (us-east-1) |
| **Vector column** | `embedding vector(1536)` |
| **Index** | IVFFlat with 100 lists: `CREATE INDEX ... USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)` |
| **Distance metric** | Cosine distance (`<=>` operator) |
| **ORM** | Hibernate `hibernate-vector` with `@JdbcTypeCode(SqlTypes.VECTOR)` |

### 7.2 Key Tables

| Table | Purpose |
|-------|---------|
| `embeddings` | Vectors + metadata (source_type, content_hash, domain, quality scores) |
| `conversation_memories` | Fact-level versioned memories with confidence scores |
| `memory_relationships` | Supersession/contradiction/refinement links between memories |
| `memory_retrieval_log` | Retrieval observability: ranked candidates, signal scores, selection status |
| `rag_evaluations` | RAGAS metric scores per interaction (pending implementation) |
| `rag_test_cases` | Benchmark test cases for Context Recall (pending implementation) |

---

## 8. Configuration & Feature Flags

### Environment Variables

| Flag | Default | Controls |
|------|---------|----------|
| `MEMORY_HYBRID_READS` | `true` | Enable hybrid retrieval (vs legacy recency-only) |
| `MEMORY_DYNAMIC_TOPK` | `true` | Enable adaptive token-budget top-k selection |
| `MEMORY_CONVO_EMBEDDINGS` | `true` | Embed conversation memories in pgvector |

### application.yaml

```yaml
ai:
  embedding:
    dimensions: 1536
    max-input-chars: 24000
  rag:
    default-vector-limit: 5
    max-context-chunks: 5
    enable-hybrid-reads: ${MEMORY_HYBRID_READS:true}
    enable-dynamic-top-k: ${MEMORY_DYNAMIC_TOPK:true}
    enable-conversation-memory-embeddings: ${MEMORY_CONVO_EMBEDDINGS:true}
  async:
    core-pool-size: 4
    max-pool-size: 8
    queue-capacity: 100
```

### Database-Level Toggles (ai_configurations table)

- `ragEnabled` -- master RAG on/off (admin UI)
- `evaluationEnabled` -- RAGAS evaluation toggle
- `evaluationSampleRate` -- evaluate every Nth interaction

---

## 9. API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/chat` | POST | Non-streaming chat with full RAG context |
| `/api/ai/chat/stream` | POST | SSE streaming chat with full RAG context |
| `/api/ai/chat/history` | GET | Retrieve stored chat history |
| `/api/ai/chat/history` | DELETE | Clear all chat history |
| `/api/ai/memories` | GET | List active conversation memories |
| `/api/ai/memories/{id}` | DELETE | Soft-deactivate a memory |
| `/api/admin/backfill-embeddings` | POST | Trigger async re-embedding of all content |
| `/api/admin/ai-config` | GET/PUT | View/update AI configuration |

---

## 10. Pending Work (Checkpoints 7-8)

### Checkpoint 7: Proactive Insights
- `InsightGeneratorService` -- scheduled daily at 8 PM
- Detects patterns: streak breaks, budget thresholds, deadline proximity, consistency drops
- LLM generates motivational insight message -> push notification

### Checkpoint 8: RAGAS Evaluation
- 4 metrics: Faithfulness, Answer Relevancy, Context Precision, Context Recall
- LLM-as-judge implementation in Java (no Python sidecar)
- Admin dashboard with score trends, distribution charts, benchmark management
- DB tables exist (V23 migration), services not yet implemented

---

## 11. Suggestions & Improvement Opportunities

### 11.1 Chunking Strategy

**Current state**: Each document (note/goal/memory) is embedded as a single unit, truncated at 8000 chars.

**Problem**: Long notes lose information beyond 8000 chars. A 5000-word journal entry gets its tail cut off. The single embedding also dilutes semantic signal -- a note covering 3 topics produces one "averaged" vector that may not match any individual topic well.

**Suggestion**: Implement overlapping chunk splitting for notes exceeding ~1000 tokens:
- Split by paragraph/section boundaries (not mid-sentence)
- 200-token overlap between consecutive chunks
- Store parent-child relationship: `chunk_index`, `parent_source_id`
- At retrieval time, if a chunk matches, optionally pull adjacent chunks for fuller context

### 11.2 Embedding Model Upgrade Path

**Current**: `text-embedding-3-small` (1536 dims, $0.02/1M tokens).

**Suggestion**: Consider `text-embedding-3-large` (3072 dims) for improved recall, especially as data grows. The cost difference is marginal at personal-project scale. This would require:
- Migration to `vector(3072)` column
- Rebuilding the IVFFlat index
- A full backfill pass

Alternatively, keep `text-embedding-3-small` but add **Matryoshka dimension reduction** (truncate to 512 dims) for faster retrieval with a re-ranking step using full dimensions.

### 11.3 Re-Ranking Pass

**Current**: Single-pass hybrid scoring selects final candidates.

**Suggestion**: Add a lightweight LLM re-ranking step after the initial top-k selection:
- Initial retrieval: fetch top 20-30 candidates via current hybrid scoring
- Re-rank: send query + candidate texts to a fast LLM (e.g., GPT-4o-mini) asking "Rate relevance 1-10"
- Final selection: top-k from re-ranked results
- This is especially valuable for ambiguous queries where keyword overlap and vector similarity disagree

### 11.4 Query Classification & Context Routing

**Current**: Every query gets the full structured context snapshot (habits, goals, gym, finance, schedule).

**Problem**: A question like "what's my protein target?" doesn't need finance data, and vice versa. Injecting all structured sections wastes tokens.

**Suggestion**: Add a fast query classifier (rule-based or small LLM call):
- Classify query intent: `fitness`, `finance`, `goals`, `schedule`, `personal`, `general`
- Only inject relevant structured sections
- Keeps context window lean, improves signal-to-noise ratio
- Could also adjust hybrid scoring weights per category (e.g., boost structured score for finance queries)

### 11.5 Structured Score Improvement

**Current**: `structuredScore` uses basic keyword overlap (`matched_terms / total_terms`) with raw string contains-matching.

**Problem**: This misses synonyms ("workout" vs "exercise"), ignores term importance (all terms weighted equally), and is easily fooled by partial string matches.

**Suggestion**:
- Use TF-IDF or BM25 for structured scoring instead of raw keyword overlap
- Add synonym expansion for common domain terms (fitness, finance, etc.)
- Weight rare terms higher than common ones
- Consider a lightweight full-text search index (PostgreSQL `tsvector/tsquery`) as a structured candidate source

### 11.6 Memory Decay & Garbage Collection

**Current**: Memories accumulate indefinitely. Old, never-accessed memories still appear as candidates.

**Suggestion**:
- Implement a scheduled cleanup job that archives memories with:
  - `access_count = 0` AND `age > 90 days`
  - `overall_confidence < 0.3`
- Add a separate "long-term memory" tier for frequently accessed facts (access_count > 10), which get higher importance_signal
- This reduces candidate pool size and improves retrieval latency as data grows

### 11.7 Embedding Staleness Detection

**Current**: Embeddings are updated on save, and SHA-256 dedup prevents redundant calls. But there's no mechanism to detect drift between the embedding and its source if the source was updated outside the normal save path (e.g., direct DB edits, bulk imports).

**Suggestion**: Add a scheduled job that:
- Scans for embeddings where `updated_at < source.updated_at`
- Re-queues stale embeddings for regeneration
- Run weekly or on-demand via admin endpoint

### 11.8 Context Window Observability

**Current**: Retrieval logging exists in `memory_retrieval_log`, but there's no visibility into the full assembled prompt token count.

**Suggestion**:
- Log the total assembled system prompt token count per request
- Track token breakdowns: profile, structured, memories, vectors
- Surface this in the admin dashboard alongside RAGAS metrics
- Helps catch context bloat before it impacts response quality

### 11.9 HNSW Index for Scale

**Current**: IVFFlat index with 100 lists. Fine for hundreds/low thousands of vectors.

**Suggestion**: If embeddings grow past ~50K rows, switch to HNSW index:
```sql
CREATE INDEX ... USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
```
HNSW provides better recall at higher vector counts with no need to tune the list count. pgvector supports it natively.

### 11.10 Evaluation Bootstrapping

**Current**: RAGAS evaluation tables exist but services are not implemented (Checkpoint 8).

**Suggestion** for when implementing:
- Seed 15-20 benchmark test cases covering each domain (fitness, finance, goals, personal, schedule) before going live
- Start with `evaluationSampleRate = 1` (every interaction) for the first 100 interactions to establish baselines
- Set up alerts if Faithfulness drops below 0.70 (indicates context-answer mismatch)
- Log the retrieved context alongside evaluation scores for debugging low-scoring interactions
