# LifeOS AI Architecture Redesign — Three-Layer Intelligence

> Redesign LifeOS AI from a monolithic hybrid RAG pipeline into three cleanly separated, independently evolvable layers: **RAG Knowledge**, **Structured App Data**, and **Persistent Memory Graph** (using Supermemory's memory-as-node model).

---

## Current State Analysis

### What exists today

| Component | File(s) | Status |
|---|---|---|
| Flat conversation memories | `ConversationMemory.java` — text blobs with domain/category tags | ✅ Working |
| Memory relationships | `MemoryRelationship.java` — tracks supersession chains | ✅ Working |
| Embedding pipeline | `EmbeddingService.java` — single-doc embeddings, truncated at 8K chars | ✅ Working |
| Memory extraction | `MemoryExtractionService.java` — LLM extracts flat text facts | ✅ Working |
| Hybrid retrieval | `MemoryRetrievalStrategyService.java` — BM25 + vector + graph + top-k | ✅ Working |
| Structured context | `StructuredContextService.java` — SQL snapshots of habits/goals/gym | ✅ Working |
| Query intent classifier | `QueryIntentClassifier.java` — keyword-based fast routing | ✅ Working but disabled |
| Prompt assembly | `PromptAssemblyService.java` — stitches context | ✅ Working |

### Key gaps vs target architecture

| Gap | Impact |
|---|---|
| **No document chunking** | Long notes lose semantic signal; truncated embeddings |
| **No Relation Typed Graph** | `MemoryRelationship` only supports `"supersedes"`, no enrichment or inference |
| **No Profile Generation** | Context doesn't distinguish between long-term facts and dynamic context |
| **No Temporal Expiry** | Temporary facts ("meeting tomorrow") stay in context forever |
| **Structured context en-masse** | Intent classifier disabled, wasting tokens by loading all SQL data |

---

## Target Architecture: Three Layers

```
┌──────────────────────────────────────────────────────────────────┐
│                     CONTEXT ASSEMBLER                            │
│  Routes query → gathers from all 3 layers → assembles prompt    │
├──────────────┬───────────────────┬───────────────────────────────┤
│              │                   │                               │
│  ┌───────────▼──┐   ┌───────────▼──────┐   ┌───────────────────▼┐
│  │ LAYER 1      │   │ LAYER 2          │   │ LAYER 3            │
│  │ RAG Knowledge│   │ Structured Data  │   │ Memory Graph       │
│  │              │   │                  │   │                    │
│  │ • Notes      │   │ • Habits (SQL)   │   │ • Atomic Memories  │
│  │ • Journals   │   │ • Goals (SQL)    │   │ • Relation Edges   │
│  │ • Documents  │   │ • Gym (SQL)      │   │ • Version Chains   │
│  │              │   │ • Finance (SQL)  │   │ • Static/Dynamic   │
│  │              │   │                  │   │ • Auto-Forgetting  │
│  │ Chunked +    │   │                  │   │                    │
│  │ Embedded     │   │ Queried directly │   │ Graph abstraction  │
│  │ in pgvector  │   │                  │   │ over AI memories   │
│  └──────────────┘   └──────────────────┘   └────────────────────┘
└──────────────────────────────────────────────────────────────────┘
```

---

## Proposed Changes — Phased Rollout

### Phase 1: RAG Knowledge Layer — Document Chunking Pipeline

**Goal**: Split long documents into overlapping chunks before embedding, store chunk metadata.

#### Database Migration
##### [NEW] `V29__add_document_chunking.sql`
```sql
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS chunk_index INTEGER DEFAULT 0;
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS total_chunks INTEGER DEFAULT 1;
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS parent_source_id UUID;
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS chunk_start_char INTEGER;
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS chunk_end_char INTEGER;
CREATE INDEX IF NOT EXISTS idx_embeddings_parent_chunks ON embeddings (user_uid, source_type, parent_source_id, chunk_index) WHERE parent_source_id IS NOT NULL;
```

#### Code Changes
- **`DocumentChunker.java`**: Stateless utility to split text on paragraph boundaries (max ~800 tokens, 200 overlap).
- **`EmbeddingService.java`**: Add `embedChunkedDocument(text)`. Deletes old chunks for source, saves new chunks.
- **`Embedding.java`**: Add metadata fields.
- **`AiFoundationProperties.java`**: Add `enableDocumentChunking`, `chunkMaxTokens`, `chunkOverlapTokens`.

---

### Phase 2: Persistent Memory Graph (Supermemory Model)

**Goal**: Evolve the existing `ConversationMemory` table into a true graph node model using Supermemory design patterns (Memory-as-Nodes, 3 relation types, static/dynamic, auto-forgetting).

#### Database Migration
##### [NEW] `V30__enhance_memory_graph.sql`
```sql
-- Enhance existing conversation_memories to act as graph nodes
ALTER TABLE conversation_memories 
    ADD COLUMN IF NOT EXISTS memory_type VARCHAR(20) DEFAULT 'dynamic',    -- 'static' | 'dynamic'
    ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT TRUE,               -- head of version chain
    ADD COLUMN IF NOT EXISTS next_version_id UUID REFERENCES conversation_memories(id), -- forward link
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,          -- auto-forget date
    ADD COLUMN IF NOT EXISTS session_id UUID,                              -- AiConversation source link
    ADD COLUMN IF NOT EXISTS forgotten BOOLEAN DEFAULT FALSE;              -- auto-expired flag

CREATE INDEX idx_memories_latest ON conversation_memories(user_uid, is_latest, forgotten);
CREATE INDEX idx_memories_expires ON conversation_memories(expires_at) WHERE forgotten = false;
```

#### Code Changes

##### [MODIFY] `ConversationMemory.java` & `MemoryRelationship.java`
- Inject new fields into `ConversationMemory`: `memoryType`, `isLatest`, `nextVersionId`, `expiresAt`, `sessionId`, `forgotten`.
- `MemoryRelationship` already exists. The `relationshipType` string will now accept:
  - `"updates"`: completely replaces previous (old marked `isLatest=false`)
  - `"extends"`: enriches existing (both stay `isLatest=true`)
  - `"derives"`: inferred from two sources

##### [NEW] `MemoryLifecycleService.java` (Auto-Forgetting)
- Implement `@Scheduled(cron = "0 0 * * * *")` hourly job.
- Marks memories as `forgotten = true` and `is_latest = false` where `expires_at < NOW()`.

##### [NEW] `MemoryGraphService.java`
- **Graph Upsert**: Handles inserting memories and establishing the `updates`/`extends`/`derives` edges and version pointers (`nextVersionId`).
- **Profile Generation**: Generates `ContextResult` with `static` array (permanent facts) and `dynamic` array (recent context) from latest memories.

##### [MODIFY] `MemoryExtractionService.java` (The MVP trick)
- Rewrite the extraction LLM prompt to construct the graph in one shot:
  1. Fetch top 15 recent user memories and pass to prompt.
  2. Ask LLM to extract new facts and flag them as `static` or `dynamic`.
  3. Ask LLM to detect if new facts `update`, `extend`, or `derive` from the existing context.
  4. Ask LLM to explicitly output `expires_at` for temporary statements.

---

### Phase 3: Structured App Data Layer — Enable Query Intent

**Goal**: Enable intent classifier, expand it, and make structured context injection selective.

#### Code Changes
- **`QueryIntentClassifier.java`**: Enable by default. Add new intents (`JOURNAL`, `NOTES`, `AI`).
- **`StructuredContextService.java`**: Wire in new intents to only fetch SQL snapshots when intent matches. Stub future features to return empty blocks.

---

### Phase 4: Context Assembly Redesign

**Goal**: Refactor `PromptAssemblyService` to pull from all three layers cleanly.

#### Code Changes
- **`PromptAssemblyService.java`**:
  - Pull `MemoryGraphService.generateProfile(userUid)` for long-term + dynamic facts.
  - Pull `StructuredContextService` based on current intents.
  - Pull `MemoryRetrievalStrategyService` for RAG matching.
  - Format clearly: `=== USER PROFILE ===`, `=== DATA: [HABITS/GYM] ===`, `=== KNOWLEDGE: DOCUMENTS ===`.
- **`MemoryRetrievalStrategyService.java`**: Reduce memory candidate budgets since Profile handles most of the graph knowledge now. Rely on vector search strictly for notes/docs.

---

### Phase 5: Pipeline Future-Proofing

**Goal**: Ensure new features plug into the pipeline easily.

#### Code Changes
- **`EmbeddingTextBuilder.java`**: Add metadata for `"journal"`, `"saved_link"`, `"document"`.
- **`IngestionPipeline.java`**: Create unified facade handling `chunking → embedding → event publishing` to make future feature adoption a 1-liner.

---

### Phase 6: Memory Graph API

**Goal**: Expose the new graph for frontend visualization.

#### Code Changes
- **`MemoryGraphController.java`**:
  - `GET /api/ai/graph/nodes` : Returns all active `ConversationMemory` nodes (with visual status based on expiry/activity).
  - `GET /api/ai/graph/edges` : Returns all `MemoryRelationship` links.
  - This API translates the backend graph into visual shapes (hexagons, linking lines) mimicking Supermemory's UI.

---

## Verification Plan

### Manual Verification
1. **Phase 1 (Chunking)**: Create >4000 char note, verify `embeddings` table has multiple chunks.
2. **Phase 2 & 4 (Memory Graph)**:
   - Chat: "I work at Google as a dev" → Check graph saves `static` memory.
   - Chat: "I am flying to NYC tomorrow" → Check graph saves `dynamic` memory with `expires_at`.
   - Chat: "I just got a job at Stripe" → Check graph creates new memory with `updates` edge, marking old one `is_latest=false`.
   - Wait 1 day → verify "flying to NYC" is `forgotten=true`.
3. **Phase 3 (Intent)**: Ask about gym, verify only gym SQL state is injected via intent logs.
