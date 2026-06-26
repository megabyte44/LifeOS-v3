-- Phase 2: Persistent Memory Graph — Supermemory model enhancement
-- Evolves conversation_memories into true graph nodes with versioning,
-- static/dynamic typing, auto-forgetting, and session provenance.

ALTER TABLE conversation_memories
    ADD COLUMN IF NOT EXISTS memory_type    VARCHAR(20) DEFAULT 'dynamic',  -- 'static' | 'dynamic'
    ADD COLUMN IF NOT EXISTS is_latest      BOOLEAN     DEFAULT TRUE,        -- head of version chain
    ADD COLUMN IF NOT EXISTS next_version_id UUID REFERENCES conversation_memories(id),  -- forward pointer
    ADD COLUMN IF NOT EXISTS expires_at     TIMESTAMP WITH TIME ZONE,        -- auto-forget timestamp
    ADD COLUMN IF NOT EXISTS session_id     UUID,                            -- AiConversation source
    ADD COLUMN IF NOT EXISTS forgotten      BOOLEAN     DEFAULT FALSE;       -- soft-expired flag

-- Fast retrieval of only the current (live) head memories per user
CREATE INDEX IF NOT EXISTS idx_memories_latest
    ON conversation_memories (user_uid, is_latest, forgotten);

-- Scheduled expiry job uses this index to find candidates efficiently
CREATE INDEX IF NOT EXISTS idx_memories_expires
    ON conversation_memories (expires_at)
    WHERE forgotten = false;
