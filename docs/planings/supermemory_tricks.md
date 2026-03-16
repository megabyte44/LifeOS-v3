# Supermemory Tricks & Ideologies → LifeOS Adoption

> 12 specific patterns extracted from Supermemory's source code & docs, mapped to concrete LifeOS actions.

---

## Trick 1: Memory Version Chains (Linked List)

**How Supermemory does it:**  
Each `MemoryEntry` has `updatesMemoryId` (points backward) + `nextVersionId` (points forward), forming a **doubly-linked list** of fact versions. The `isLatest` flag marks the head.

```
Memory: "Alex works at Google"     ← isLatest: false, nextVersionId: "mem_2"
    ↑ updatesMemoryId
Memory: "Alex now works at Stripe" ← isLatest: true, updatesMemoryId: "mem_1"
```

**LifeOS adoption:**  
Your `ConversationMemory` already has `superseded_by` and `parent_memory_id` — this IS the backward pointer. Just add:
- `next_version_id` column (forward pointer for fast chain traversal)
- `is_latest` boolean (explicit flag instead of checking `active && superseded_by IS NULL`)

**Impact:** Retrieval can instantly grab only the latest version of each fact without scanning the whole chain.

---

## Trick 2: Static vs Dynamic Profile (Auto-Generated)

**How Supermemory does it:**  
Profile is **not a separate table** — it's computed on-the-fly from the memory graph:
```json
{
  "profile": {
    "static": ["User is a software engineer", "Prefers dark mode"],
    "dynamic": ["Working on Project Alpha", "Debugging auth issues"]
  }
}
```
- `static` = long-term facts that rarely change (name, job, preferences)
- `dynamic` = recent context that evolves (current projects, recent activities)

**LifeOS adoption:**  
You already have `UserProfile` with manually-enriched fields (age, occupation). Upgrade to:
- Tag each `ConversationMemory` as `memory_type = 'static' | 'dynamic'`
- Build a `ProfileGenerationService` that generates a profile view by aggregating `isLatest=true` memories grouped by type
- Inject this auto-generated profile alongside the manual `UserProfile` → eventually replace the manual one

**Key insight:** The LLM decides static vs dynamic at extraction time, not the user.

---

## Trick 3: Automatic Forgetting with `forgetAfter`

**How Supermemory does it:**  
Temporal facts get a `forgetAfter` timestamp:
```
"I have an exam tomorrow" → forgetAfter: tomorrow_midnight
"Meeting at 3pm today"    → forgetAfter: end_of_today
```
A background job marks memories as `isForgotten = true` after expiry.

**LifeOS adoption:**  
Add `expires_at TIMESTAMP` and `forgotten BOOLEAN` columns to `conversation_memories`. Add the extraction prompt instruction:
```
If the fact is temporal (meeting, deadline, event), set
expires_at to the datetime when this fact becomes irrelevant.
```
Add a `@Scheduled` job (like your existing `InsightGeneratorService` cron) that runs daily:
```sql
UPDATE conversation_memories SET forgotten = true, is_latest = false
WHERE expires_at < NOW() AND forgotten = false;
```

---

## Trick 4: Only Three Relationship Types

**How Supermemory does it:**  
Instead of a complex ontology (works_on, is_friend_of, studies_at...), they use ONLY three generic relation types:

| Type | When | Example |
|---|---|---|
| `updates` | New fact contradicts old | "Works at Stripe" updates "Works at Google" |
| `extends` | New fact enriches old | "Leads team of 5" extends "Works at Stripe" |
| `derives` | System infers connection | "Likely works on payments" derived from "PM at Stripe" + "discusses payment APIs" |

**LifeOS adoption:**  
Your `MemoryRelationship` already exists with a `relationship_type` column. Just:
- Expand allowed values: `'updates' | 'extends' | 'derives'` (keep `'supersedes'` as alias of `'updates'`)
- When `updates`: mark old memory's `is_latest = false`
- When `extends`: both memories stay `is_latest = true`
- When `derives`: create new derived memory linked to sources

**Key insight:** This is much more reliable for LLM classification than entity-relation ontologies. GPT-4o-mini can do "does this update, extend, or introduce new info?" with >90% accuracy. It struggles with "is this works_on or member_of?" at ~60%.

---

## Trick 5: Document → Memory Hierarchy

**How Supermemory does it:**  
```
Document (raw input)
├── memoryEntries[]: MemoryEntry[]  (extracted atomic facts)
├── summary: string                 (LLM-generated summary)
├── summaryEmbedding: number[]      (separate embedding for the summary)
├── chunkCount: number
├── contentHash: string             (for dedup/diff detection)
└── status: "pending" | "processing" | "done" | "failed"
```
Documents own memories. A single conversation can produce multiple memories. The document retains the raw content; memories are the distilled facts.

**LifeOS adoption:**  
You already have this implicitly: `AiChatHistory` holds raw conversations, `ConversationMemory` holds extracted facts. Make it explicit:
- Add `session_id UUID` to `ConversationMemory` → links to `AiConversation.id`
- This enables the SESSION grouping shown in Screenshot 1 ("User Introduces Themselves and Shares Personal Details" → 3 memories)
- Enables UI: click a session → see all memories it generated

---

## Trick 6: Diff-Based Ingestion (Only Process New Parts)

**How Supermemory does it:**  
When you re-add content with the same `customId`, Supermemory compares `contentHash` and only processes the diff. This prevents re-embedding unchanged content.

```typescript
await client.add({
  content: "user: Hi\nassistant: Hello!",
  customId: "conv_123"
});
// Later — only new messages are processed
await client.add({
  content: "user: What's the weather?\nassistant: Sunny today.",
  customId: "conv_123"
});
```

**LifeOS adoption:**  
Your `EmbeddingService` already does content-hash dedup via SHA-256 on `Embedding.contentHash`. Extend this pattern to memory extraction:
- Store the conversation hash *up to the point* where extraction ran
- On next extraction, skip ahead to only extract from new messages
- Prevents duplicate memories from re-processing the same conversation turns

---

## Trick 7: Combined Profile + Search in One Call

**How Supermemory does it:**  
The `/profile` endpoint returns profile **and** search results in a single request:
```typescript
const result = await client.profile({
  containerTag: "user_123",
  q: "deployment errors"    // optional
});
// result.profile.static   → long-term facts
// result.profile.dynamic  → recent context
// result.searchResults    → relevant memories for this query
```

**LifeOS adoption:**  
Your `PromptAssemblyService.buildFullSystemPrompt()` already does this in practice (calls profile + retrieval). Formalize it:
- Create a `ContextResult` DTO with `profile` (static + dynamic facts), `memories` (relevant retrieved memories), and `structuredData` (app data)
- Assembly service returns this structured result
- Enables both prompt injection AND frontend display of what context the AI used

---

## Trick 8: Memory Status Lifecycle

**How Supermemory does it:**  
Each memory has a lifecycle status visible in the graph:

```
New memory    → just extracted, green indicator
Active        → in use, normal display
Expiring soon → temporal fact approaching forgetAfter, orange
Forgotten     → expired or superseded, red ✕, excluded from context
```

**LifeOS adoption:**  
Add computed status to memory retrieval:
```java
public String computeStatus(ConversationMemory mem) {
    if (mem.isForgotten()) return "forgotten";
    if (mem.getExpiresAt() != null && mem.getExpiresAt().isBefore(
        Instant.now().plus(Duration.ofDays(1)))) return "expiring";
    if (mem.getCreatedAt().isAfter(
        Instant.now().minus(Duration.ofHours(24)))) return "new";
    return "active";
}
```
This powers both the graph visualization and retrieval filtering.

---

## Trick 9: Summary Embeddings (Separate from Content)

**How Supermemory does it:**  
Documents have TWO embedding types:
1. **Content chunks** → embedded for detailed semantic search
2. **Summary embedding** → single vector for document-level similarity

The summary embedding enables fast document-to-document comparison without comparing all chunk pairs.

**LifeOS adoption:**  
When implementing document chunking:
- Store chunk embeddings as before (multiple rows in `embeddings`)
- Also store a summary embedding for the whole document: `source_type = "note_summary"` with the LLM-generated summary text
- Use summary embeddings for graph edges between documents (much cheaper than comparing all chunk pairs)

---

## Trick 10: Client-Side Similarity for Graph Visualization

**How Supermemory does it (from `similarity.ts`):**  
Graph edges are weighted by cosine similarity computed **client-side** from embeddings included in the API response:

```typescript
// Visual scaling based on similarity strength
return {
    opacity: similarity,                      // 0 to 1
    thickness: Math.max(1, similarity * 4),   // 1-4px
    glow: similarity * 0.6,                   // glow intensity
    pulseDuration: 2000 + (1 - similarity) * 3000  // faster = more similar
};
```

**LifeOS adoption:**  
When building the graph visualization API:
- Include embeddings (or pre-computed similarity scores) in the `/api/ai/graph` response
- Let the frontend compute edge weights and visual properties
- This avoids N² similarity computations on the server on every page load

---

## Trick 11: Processing Pipeline Status Tracking

**How Supermemory does it:**  
Every document has a `status` field tracking its pipeline progress:
```
"pending" → "processing" → "done" | "failed"
```
Plus `processingMetadata` for debugging and observability.

**LifeOS adoption:**  
Your embedding pipeline is fire-and-forget via `@Async` events. Add basic status tracking:
- Add `embedding_status VARCHAR(20) DEFAULT 'pending'` to entities that get embedded
- Event listener updates status to `'processing'` → `'done'` or `'failed'`
- Enables a "Memory Health" dashboard showing pending/failed embeddings

---

## Trick 12: Memory Extraction with Relationship Detection in One LLM Call

**How Supermemory does it:**  
A single LLM call both:
1. Extracts atomic facts from conversation
2. Detects relationships to existing memories (updates/extends/derives)

It provides the LLM with recent existing memories as context so it can spot contradictions and enrichments.

**LifeOS adoption:**  
Modify `MemoryExtractionService.extractAndStore()`:
1. Before calling the LLM, fetch the user's latest N memories (e.g., top 20 by recency)
2. Include them in the extraction prompt:
   ```
   EXISTING MEMORIES (check if new facts update or extend any of these):
   - [mem_1] "Punith's age is 19"
   - [mem_2] "Punith studies CSE"
   ...
   
   For each extracted fact, indicate:
   - memory_type: "static" | "dynamic"
   - relation: null | {"type": "updates"|"extends"|"derives", "target_id": "mem_X"}
   - expires_at: null | ISO timestamp (for temporal facts)
   ```
3. Save the relationships in `MemoryRelationship` table

**This is the single most impactful trick** — it turns flat fact extraction into graph construction in one step.

---

## Summary: Priority Implementation Order

| Priority | Trick | Effort | Impact |
|---|---|---|---|
| 🔴 P0 | #12 — Relationship detection in extraction | Medium | Enables the entire graph |
| 🔴 P0 | #4 — Three relation types | Low | Foundation for graph model |
| 🟡 P1 | #2 — Static/dynamic profile | Medium | Better context quality |
| 🟡 P1 | #1 — Version chains | Low | Fast latest-version retrieval |
| 🟡 P1 | #3 — Automatic forgetting | Low | Cleaner memory over time |
| 🟡 P1 | #5 — Session grouping | Low | Memory provenance tracking |
| 🟢 P2 | #8 — Status lifecycle | Low | Graph visualization prep |
| 🟢 P2 | #7 — Combined profile+search | Medium | Cleaner architecture |
| 🟢 P2 | #6 — Diff-based ingestion | Medium | Reduced API costs |
| 🟢 P2 | #10 — Client-side similarity | Low | Graph visualization |
| 🔵 P3 | #9 — Summary embeddings | Medium | Better doc-level search |
| 🔵 P3 | #11 — Pipeline status tracking | Low | Observability |
