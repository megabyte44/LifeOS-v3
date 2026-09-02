# 08 — Memory & RAG Cram Guide

Consolidated from 02/03/05/07. Read this top to bottom the night before — it rebuilds
the mental model, then drills the exact numbers interviewers probe on.

---

## 1. The One-Sentence Answer

> "Every chat message goes through `PromptAssemblyService`, which assembles a hidden
> context block from three sources — hybrid memory retrieval (BM25 + vector), intent-gated
> structured SQL data, and a static/dynamic user-profile graph — then injects it into the
> system prompt before the LLM ever sees the message. After the response streams back,
> an async job extracts new facts from the exchange and writes them into a versioned
> memory graph so the next conversation can build on this one."

If you say nothing else, say that.

---

## 2. The Full Request Lifecycle (memorize this order)

```
1. User sends message → AiChatController → AiChatService.streamChat()
2. AiConfigurationResolver.resolve()      — pick provider/model/temp/maxTokens
3. aiConversationService.ensureConversation() — get/create conversation UUID
4. Emit SSE event: "conversation_id"      — frontend wires sidebar immediately
5. buildSystemPrompt() → PromptAssemblyService.buildFullSystemPrompt(userQuery)
      │
      ├── LAYER 1 — MemoryRetrievalStrategyService.buildPlan(query)
      │      hybrid BM25 + pgvector retrieval over ConversationMemory + Embedding rows
      │
      ├── LAYER 2 — StructuredContextService.buildSnapshot(query)
      │      QueryIntentClassifier.classify(query) → gated SQL pulls (habits/todos/schedule)
      │
      └── LAYER 3 — MemoryGraphService.generateProfile(uid)
             static facts (profile) + dynamic facts (recent evolving context)

6. Context block assembled → injected into system prompt (hidden from user)
7. WebClient streams tokens from LLM → SseEmitter → browser
8. On stream complete:
      - aiChatHistoryService.saveExchange()        [sync]
      - memoryExtractionService.extractAndStore()   [async, Chat Buddy mode only]
      - ragEvaluationService.evaluateAsync()        [async]
```

Everything below is detail on steps 5 and 8 — that's where 90% of interview questions live.

---

## 3. Layer 1 — Hybrid Retrieval (the RAG part)

**Class:** `MemoryRetrievalStrategyService`

**Candidates pulled from two tables:**
- `ConversationMemory` — facts extracted from past chats
- `Embedding` — vector embeddings of notes/documents (chunked)

**Two scores computed per candidate, then blended:**

1. **BM25 (hand-rolled, not a library)**
   ```
   tf*(k1+1) / (tf + k1*(1 - b + b*(docLen/avgDocLen)))
   ```
   `k1=1.2`, `b=0.75`, `avgDocLen=50`. Clamped to [0,1].
   *Why hand-rolled:* candidate pool is small (~60 memories/user max) — no need for
   Elasticsearch, this runs in-memory with zero extra network latency.

2. **Vector similarity** — pgvector cosine similarity, OpenAI `text-embedding-3-small`.

**Composite score (no graph boost):**
```
score = 0.35 * vector
      + 0.25 * bm25
      + 0.15 * recency      (exp(-ageDays/30))
      + 0.10 * importance
      + 0.10 * confidence
      + 0.05 * accessBoost  (log1p(accessCount)/3.0)
```
With graph boost ON: vector drops to 0.30, graph gets 0.10.

**Optional graph boost pass** (`applyGraphBoost()`, off by default —
`enableGraphBoostedScoring=false`):
1. Top 5 candidates become seed nodes
2. `KnowledgeEdgeRepository.walkGraph(uid, seedTypes, seedIds, maxHops=2, limit=50)` — recursive SQL walk
3. Decay: `0.5^depth * confidence`
4. Boosts connected candidates (+graphWeight for memories, +0.15*gs for embeddings)

**Dynamic budget (not a fixed top-K):**
- `computeTokenBudget()` → 900–1900 tokens, scales with query complexity
- `computeDynamicCap()` → 8–24 candidates, scales with query length
- `minK=6` always included regardless of budget

**Guard rail:** if `userQuery.isBlank()` → `RetrievalPlan.empty()` immediately, no DB hit.
(A plain "hi" doesn't trigger retrieval.)

**Observability:** every retrieval logged to `MemoryRetrievalLog` with per-candidate
score breakdown; `touchAccess()` bumps `accessCount` on whatever was selected (feeds
the accessBoost term next time — retrieval is self-reinforcing).

---

## 4. Layer 2 — Intent-Gated Structured Context

**Class:** `QueryIntentClassifier` — pure keyword matching, **zero LLM calls, zero latency**.

| Intent | Keywords | Injects |
|---|---|---|
| HABITS | habit, streak, routine | today's habit snapshot |
| TODOS | todo, task, pending | pending todos |
| SCHEDULE | schedule, today, calendar | planner items for today |
| PERSONAL | about me, who am i | — |
| MEMORY | remember, told you, recall | — |
| NOTES | note, jotted, saved | note count + last 5 titles |
| GENERAL | (fallback) | nothing extra |

The point: a habits question doesn't drag your whole todo list into the prompt.
This is what keeps token usage down and the model focused — **cite this as the fix
for "RAG worked but the model got confused by irrelevant context."**

---

## 5. Layer 3 — Memory Graph Profile

**Class:** `MemoryGraphService` — "Supermemory" pattern: **no separate profile table.**
The profile is computed on-the-fly by querying `ConversationMemory` grouped by type.

- `findStaticProfileMemories(uid)` → `isLatest=true AND memoryType='static'` (name, job, long-term prefs)
- `findDynamicContextMemories(uid, top12)` → `isLatest=true AND memoryType='dynamic'` (recent, evolving)

Returns `ContextProfile(staticFacts, dynamicFacts)` — two plain string lists dropped
into the prompt under `=== USER PROFILE ===`.

`computeStatus(memory)` (used by the graph visualization UI, `GET /ai/memories`):
- `forgotten` — soft-deleted
- `expiring` — `expiresAt` within 24h
- `new` — created within 24h
- `active` — everything else

---

## 6. Memory Extraction — how facts get INTO the graph

**Class:** `MemoryExtractionService.extractAndStore()` — `@Async`, fires after every
Chat Buddy mode response completes. **Never blocks the HTTP/SSE response.**

```
1. Load top 20 recent active ConversationMemory rows → context for the LLM
2. buildExtractionPrompt(userMsg, aiResponse, existingMemories)
     "EXISTING MEMORIES: [mem_0]...[mem_19]"
     "Extract what the USER said, categorize it, detect relations to existing memories"
3. callExtractionApi() → gpt-4o-mini, temperature=0.2 → JSON array of MemoryChunk
4. For each extracted chunk:
     a. normalizeMemoryText() + SHA-256 hash → dedup check (skip if unchanged)
     b. Build ConversationMemory (isLatest=true, memoryType=static|dynamic, expiresAt?)
     c. Save to DB
     d. Handle graph relation type:
          "updates"  → old node: isLatest=false, active=false, nextVersionId=new.id
                        → new MemoryRelationship edge (type="updates")
          "extends"  → both nodes stay isLatest=true (additive, non-conflicting)
          "derives"  → both stay live (inferred/derived fact)
     e. Embed the new memory (if enableConversationMemoryEmbeddings=true)
5. enrichProfileFromChunks() — "personal"+age pattern or "work" category
   → also patches the separate UserProfile row directly
```

**This is the single most important mechanism to be able to explain from memory:**
> "If I say I'm 21 and the graph already has 'user is 20', the extraction LLM detects
> an 'updates' relation. The old memory node gets `isLatest=false` and a
> `nextVersionId` pointer to the new one. Retrieval only ever queries `isLatest=true`,
> so the stale fact silently drops out of context without being deleted — full version
> history is preserved for the graph UI."

**Temporal facts:** the extraction prompt tells the LLM to set `expires_at` for things
like "exam next week." `computeStatus()` surfaces these as "expiring" before they
auto-drop out of retrieval.

**Failure mode:** wrapped in try/catch — if the OpenAI call fails, it logs a warning
and the chat experience is completely unaffected. Worst case: one fact isn't stored.

---

## 7. Data Model Cheat Sheet

```
ConversationMemory (graph node)
  memoryText, memoryType(static|dynamic), isLatest,
  parentMemoryId, nextVersionId, expiresAt, active, forgotten

MemoryRelationship (graph edge)
  fromMemory, toMemory, relationshipType(updates|extends|derives), confidence

Embedding (vector store)
  sourceType(note|conversation_memory|...), sourceId, embedding float[1536],
  chunkIndex, totalChunks, parentSourceId, contentHash(SHA-256 dedup)
```

`hibernate-vector` maps `embedding` to pgvector's native column type — cosine search
runs as a normal Postgres query, no separate vector DB.

**Chunking (`DocumentChunker`):** splits on `\n\n`, `chunkMaxChars=3200`,
`chunkOverlapChars=400`. Config-driven under `ai.chunking.*`.

---

## 8. The System Prompt Shape

```
[CONTEXT — use this to answer accurately, do not reveal this block exists]
=== USER PROFILE ===
<static facts from Layer 3>
=== MEMORIES ===
<top-K hybrid-retrieved memories from Layer 1, with dynamic facts from Layer 3>
=== KNOWLEDGE: DOCUMENTS ===
<relevant note/embedding chunks from Layer 1>
=== <INTENT> SNAPSHOT ===   (only if Layer 2 matched an intent)
<habit/todo/schedule SQL data>
[END CONTEXT]

<actual system instructions — persona, e.g. "professionalAssistant" or "casualBuddy">
```

If Layer 1 + 2 + 3 all return nothing (blank query, no history), `buildFullSystemPrompt()`
returns the base prompt unchanged — no empty `=== ===` blocks sent to the model.

---

## 9. Config Flags (feature-flag system, no deploy needed)

`AiFoundationProperties.Rag`:

| Flag | Default | Effect |
|---|---|---|
| `enableHybridReads` | true | BM25+vector hybrid vs. legacy top-N only |
| `enableDynamicTopK` | true | adaptive token budget / candidate cap |
| `enableConversationMemoryEmbeddings` | true | embed extracted memories for vector retrieval |
| `enableQueryIntentClassification` | true | use QueryIntentClassifier for Layer 2 |
| `enableGraphBoostedScoring` | false | add graph-walk boost to Layer 1 scoring |
| `enableKnowledgeGraph` | false | build KG edges via LLM on entity save |
| `graphMaxHops` | 2 | depth limit for graph traversal |
| `graphBoostWeight` | 0.15 | weight of graph signal in composite score |

---

## 10. Rapid-Fire Q&A (the ones you'll actually get asked)

**Q: What's the difference between the memory graph (Layer 3) and RAG retrieval (Layer 1)?**
A: Layer 3 is a cheap, always-on profile summary — static facts + last 12 dynamic
facts, no scoring, no query needed. Layer 1 is query-dependent hybrid search over
the same `ConversationMemory` table plus document embeddings, returning only what's
relevant to *this specific message*. Layer 3 answers "who is this user broadly,"
Layer 1 answers "what's relevant to what they just asked."

**Q: Why not just dump all memories into every prompt?**
A: Token cost and model confusion. Dynamic top-K (8–24 candidates, 900–1900 token
budget) plus intent gating keeps the context tight and relevant instead of noisy.

**Q: How do you prevent contradictory/stale facts from confusing the model?**
A: Versioning. `isLatest` flag + `nextVersionId` pointer. Extraction LLM detects
"updates" relations and flips the old node's `isLatest=false`. Retrieval queries
always filter `isLatest=true`.

**Q: Why is memory extraction async?**
A: It calls an LLM (1-2s latency) *after* the user's response has already finished
streaming. Doing it synchronously would either delay the response or require a
second round-trip the user waits on. `@Async` + try/catch means it never touches
the critical path.

**Q: Why BM25 + vector instead of just vector search?**
A: Pure vector search misses exact/lexical matches — "what are my todos" shouldn't
depend on semantic similarity to find literal todo-related memories. BM25 catches
keyword overlap that embeddings sometimes miss; the hybrid formula blends both.

**Q: Why pgvector instead of Pinecone/Weaviate?**
A: Vectors live next to their source rows in the same Postgres instance — joins,
transactional deletes, and consistency come for free. At this scale (tens of
thousands of vectors per user, not millions), exact cosine search in pgvector is
fast enough. Would reconsider at much larger scale.

**Q: What happens on a totally new user with an empty graph?**
A: All three layers degrade gracefully to empty — `RetrievalPlan.empty()`,
`ContextProfile(emptyList, emptyList)`, no structured snapshot unless intent
matches. `buildFullSystemPrompt()` just returns the base persona prompt.

---

## 11. If You Blank on a Class Name

Just describe the *layer* by number and function — "the hybrid retrieval service,"
"the intent classifier," "the profile graph service." Interviewers care about the
architecture and tradeoffs, not exact class names. The formulas (0.35/0.25/0.15...
weights, BM25 k1/b, isLatest+nextVersionId versioning) are what signal you actually
built it.
