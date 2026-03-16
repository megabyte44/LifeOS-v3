# Supermemory Architecture Analysis → LifeOS Mapping

> Deep dive into how Supermemory implements its memory graph, and how to adapt it for LifeOS.

---

## Supermemory's Core Model

### Key Insight: Memories ARE the graph nodes

Supermemory does **not** use a separate entity-relation table like I originally proposed. Instead:

- Each **memory** is a graph node (an atomic fact statement)
- Memories are linked to **each other** via typed edges
- The graph is memory-to-memory, not entity-to-entity

```
┌──────────────────────────────┐
│ Memory Node                  │
│ "Alex works at Stripe as PM" │
│                              │
│ status: latest               │
│ type: career / dynamic       │
│ embedding: vector(1536)      │
│ created: 2026-03-01          │
│ connections: 3               │
└──────┬───────────────────────┘
       │ UPDATES
       ▼
┌──────────────────────────────┐
│ Memory Node                  │
│ "Alex worked at Google"      │
│                              │
│ status: superseded           │
│ type: career / dynamic       │
│ embedding: vector(1536)      │
│ created: 2026-01-15          │
└──────────────────────────────┘
```

### Three Relationship Types (Only Three!)

| Relation | When | Effect |
|---|---|---|
| **Updates** | New fact contradicts/replaces old fact | Old memory marked `superseded`, new memory marked `isLatest` |
| **Extends** | New fact enriches existing fact without contradicting | Both memories remain active, linked as enrichment |
| **Derives** | System infers connection between two facts | New derived memory created, linked to source memories |

### Examples from Supermemory docs

**Updates:**
```
Memory 1: "Alex works at Google as a software engineer"
Memory 2: "Alex just started at Stripe as a PM"
→ Memory 2 UPDATES Memory 1 (Memory 1 still stored but marked superseded)
```

**Extends:**
```
Memory 1: "Alex works at Stripe as a PM"
Memory 2: "Alex focuses on payments infrastructure and leads a team of 5"
→ Memory 2 EXTENDS Memory 1 (both remain active)
```

**Derives:**
```
Memory 1: "Alex is a PM at Stripe"
Memory 2: "Alex frequently discusses payment APIs and fraud detection"
→ Derived: "Alex likely works on Stripe's core payments product"
```

### Memory Types (from screenshots)

From the screenshots you shared, Supermemory classifies memories into:

| Type | Description | Examples |
|---|---|---|
| **Static** | Permanent identity facts | "Punith's name is Punith" |
| **Dynamic** | Facts that can change over time | "Punith's age is 19", "Punith has a girlfriend named Pranati" |

### Memory Status (from graph legend)

| Status | Visual | Meaning |
|---|---|---|
| **New memory** | 🟢 green | Recently extracted |
| **Expiring soon** | 🟠 orange | Temporal fact approaching expiry |
| **Forgotten** | 🔴 red | Expired or superseded, no longer used in context |

### Automatic Forgetting

Supermemory auto-expires temporal facts:
```
"I have an exam tomorrow" → after the date passes → automatically forgotten
"Meeting with Alex at 3pm today" → after today → automatically forgotten
```

### Profile Generation

Profile is **auto-generated** from the memory graph, split into:
- `profile.static` → long-term facts: `["Senior engineer at Acme", "Prefers dark mode"]`
- `profile.dynamic` → recent context: `["Working on auth migration", "Debugging rate limits"]`

### Session Tracking

From Screenshot 1 — sessions group memories by conversation:
```
SESSION
├── "User Introduces Themselves and Shares Personal Details" (3h ago)
│   ├── Memory: "Punith's name is Punith"
│   ├── Memory: "Punith's age is 19"
│   └── Memory: "Punith has a girlfriend named Pranati"
```

---

## How This Differs From My Original Plan

| Aspect | My Original Plan | Supermemory's Approach | Better Choice |
|---|---|---|---|
| **Graph nodes** | Separate `MemoryEntity` table (person, project, etc.) | Memories themselves are nodes | **Supermemory** — simpler, maps directly to existing `ConversationMemory` |
| **Relations** | Entity-to-entity triples (`works_on`, `is_friend_of`) | Memory-to-memory edges (`updates`, `extends`, `derives`) | **Supermemory** — fewer relation types, LLM can reliably detect these 3 |
| **Entity extraction** | Extract structured `(Subject, Predicate, Object)` triples | Extract memory facts, let the graph handle relationships | **Supermemory** — LLMs are much better at extracting facts than triples |
| **Profile** | Separate `UserProfile` table with manually enriched fields | Auto-generated from memory graph | **Hybrid** — keep structured profile, but augment with graph-derived profile |
| **Fact storage** | Separate `MemoryEntityFact` table | Facts ARE memories, typed as static/dynamic | **Supermemory** — eliminates an entire table, simpler data model |

### Key Takeaway

> **My original plan was over-engineered.** An entity-relation graph (Neo4j-style) is powerful but overkill for a personal assistant. Supermemory's model is simpler and more practical:
> 
> 1. Extract atomic facts from conversations (what you already do!)
> 2. When storing a new fact, check if it **updates**, **extends**, or is independent of existing facts
> 3. Mark relationships between memories with one of three types
> 4. Auto-generate a profile view from the latest, active memories
>
> This maps almost perfectly onto your existing `ConversationMemory` + `MemoryRelationship` tables — you just need to evolve them slightly.

---

## Revised Mapping to LifeOS

### What you already have (and can keep!)

| LifeOS Component | Maps to Supermemory | Status |
|---|---|---|
| `ConversationMemory` | Memory nodes | ✅ **Already exists!** |
| `MemoryRelationship` | Memory-to-memory edges | ✅ **Already exists!** (just needs typed relations) |
| `MemoryExtractionService` | Automatic memory extraction | ✅ **Already exists!** |
| `superseded_by` field | Updates relationship | ✅ **Already exists!** |
| `active` field | isLatest flag | ✅ **Already exists!** |
| SHA-256 hash dedup | Duplicate detection | ✅ **Already exists!** |

### What needs to change

| Change | Details |
|---|---|
| **Add `memory_type` column** | `static` or `dynamic` — classify each memory |
| **Add `is_latest` flag** | Explicitly mark the latest in an Updates chain (currently implicit via `active`) |
| **Add `expires_at` column** | For temporal facts that should auto-forget |
| **Add `session_id` column** | Group memories by conversation session |
| **Expand `MemoryRelationship.relationshipType`** | Current: only `"supersedes"`. New: `"updates"`, `"extends"`, `"derives"` |
| **Modify extraction prompt** | Tell LLM to classify each fact as static/dynamic and detect relationships |
| **Add relationship detection** | When storing a new memory, use LLM or vector similarity to check if it updates/extends an existing one |
| **Add auto-forgetting job** | Scheduled job that marks memories past `expires_at` as forgotten |
| **Add profile generation** | Auto-generate structured profile from `static` + `dynamic` memories |

### What to remove from my original plan

- ~~`memory_entities` table~~ → Not needed. Memories ARE the nodes.
- ~~`memory_entity_relations` table~~ → Not needed. `MemoryRelationship` already handles this.
- ~~`memory_entity_facts` table~~ → Not needed. Facts ARE memories.
- ~~Entity extraction (Subject, Predicate, Object)~~ → Too complex. Keep fact-level extraction.

---

## Revised Data Model

### ConversationMemory (enhanced)

```sql
-- ADD these columns to existing conversation_memories table
ALTER TABLE conversation_memories 
    ADD COLUMN IF NOT EXISTS memory_type VARCHAR(20) DEFAULT 'dynamic',    -- 'static' | 'dynamic'
    ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT TRUE,               -- latest in update chain
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,          -- for temporal facts
    ADD COLUMN IF NOT EXISTS session_id UUID,                              -- group by conversation
    ADD COLUMN IF NOT EXISTS forgotten BOOLEAN DEFAULT FALSE;              -- auto-expired
```

### MemoryRelationship (enhanced)

```sql
-- Existing table already has: from_memory_id, to_memory_id, relationship_type, confidence
-- Just need to support the new relationship types:
-- 'updates'  → new memory replaces old (old gets is_latest=false)
-- 'extends'  → new memory enriches old (both stay active)
-- 'derives'  → inferred connection between two memories
-- 'supersedes' → keep for backward compat (treated same as 'updates')
```

### Memory Retrieval Flow (Supermemory-aligned)

```
Query → Entity Recognition → Graph Traversal → Temporal Filtering → Context Assembly → LLM

1. Embed query
2. Vector search → find relevant memory nodes
3. For each matched memory, follow edges:
   - If memory has "Updates" children → use the isLatest one
   - If memory has "Extends" links → pull the extension into context
   - If memory has "Derives" links → include derived insight
4. Filter out expired (forgotten) memories
5. Separate into static profile + dynamic context
6. Assemble into prompt
```

---

## Screenshots Decoded

### Screenshot 1 (Context tab)

![Supermemory Context Tab](C:/Users/punit/.gemini/antigravity/brain/427d6f1b-d118-408a-8277-d7646499a853/uploaded_media_0_1773579152983.png)

| UI Element | What it shows | LifeOS equivalent |
|---|---|---|
| MEMORIES panel (left) | All extracted memory nodes with timestamps + source session | `GET /api/ai/memories` (you already have this!) |
| PROFILE > STATIC | Permanent facts auto-extracted | Auto-generated from `memory_type = 'static'` memories |
| PROFILE > DYNAMIC | Changeable facts | Auto-generated from `memory_type = 'dynamic'` memories |
| SESSION | Conversation that generated these memories | Group by `session_id` (maps to your `AiConversation`) |

### Screenshot 2 (Graph tab)

![Supermemory Graph Tab](C:/Users/punit/.gemini/antigravity/brain/427d6f1b-d118-408a-8277-d7646499a853/uploaded_media_1_1773579152983.png)

| UI Element | What it shows | LifeOS equivalent |
|---|---|---|
| Memory nodes (hexagons) | Each memory as a graph node | `ConversationMemory` rows |
| Connections (lines) | Relationships between memories | `MemoryRelationship` rows |
| Legend > RELATIONS | Updates / Extends / Derives | `MemoryRelationship.relationshipType` |
| Legend > STATUS | New / Expiring / Forgotten | `is_latest` + `expires_at` + `forgotten` |
| Legend > SIMILARITY | Weak / Strong | Vector cosine similarity between memory embeddings |
| Doc → Memory connections | Which document generated which memory | `source_conversation_id` on memory |
