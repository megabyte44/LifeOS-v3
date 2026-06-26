CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE conversation_memories
    ADD COLUMN IF NOT EXISTS memory_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS domain VARCHAR(100),
    ADD COLUMN IF NOT EXISTS factuality_score FLOAT NOT NULL DEFAULT 0.70,
    ADD COLUMN IF NOT EXISTS relevance_score FLOAT NOT NULL DEFAULT 0.70,
    ADD COLUMN IF NOT EXISTS timeliness_score FLOAT NOT NULL DEFAULT 0.70,
    ADD COLUMN IF NOT EXISTS overall_confidence FLOAT NOT NULL DEFAULT 0.70,
    ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) NOT NULL DEFAULT 'unverified',
    ADD COLUMN IF NOT EXISTS extraction_model VARCHAR(120),
    ADD COLUMN IF NOT EXISTS extraction_confidence FLOAT,
    ADD COLUMN IF NOT EXISTS parent_memory_id UUID,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS access_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE conversation_memories
    DROP CONSTRAINT IF EXISTS fk_memories_parent_memory;

ALTER TABLE conversation_memories
    ADD CONSTRAINT fk_memories_parent_memory
        FOREIGN KEY (parent_memory_id) REFERENCES conversation_memories(id) ON DELETE SET NULL;

UPDATE conversation_memories
SET memory_hash = encode(digest(lower(trim(memory_text)), 'sha256'), 'hex')
WHERE memory_hash IS NULL;

WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY user_uid, memory_hash
               ORDER BY COALESCE(updated_at, created_at) DESC, created_at DESC, id DESC
           ) AS rn
    FROM conversation_memories
    WHERE active = true
)
UPDATE conversation_memories cm
SET active = false,
    archived_at = COALESCE(cm.archived_at, CURRENT_TIMESTAMP),
    updated_at = CURRENT_TIMESTAMP
FROM ranked r
WHERE cm.id = r.id
  AND r.rn > 1;

ALTER TABLE conversation_memories
    ALTER COLUMN memory_hash SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memories_user_hash_active
    ON conversation_memories (user_uid, memory_hash, active);

CREATE INDEX IF NOT EXISTS idx_memories_user_domain_active
    ON conversation_memories (user_uid, domain, active, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_memories_user_hash_active
    ON conversation_memories (user_uid, memory_hash)
    WHERE active = true;

CREATE TABLE IF NOT EXISTS memory_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid VARCHAR(255) NOT NULL,
    from_memory_id UUID NOT NULL,
    to_memory_id UUID NOT NULL,
    relationship_type VARCHAR(30) NOT NULL,
    confidence FLOAT NOT NULL DEFAULT 0.70,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_memory_relationships_user_uid FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE,
    CONSTRAINT fk_memory_relationships_from FOREIGN KEY (from_memory_id) REFERENCES conversation_memories(id) ON DELETE CASCADE,
    CONSTRAINT fk_memory_relationships_to FOREIGN KEY (to_memory_id) REFERENCES conversation_memories(id) ON DELETE CASCADE,
    CONSTRAINT chk_memory_relationship_type CHECK (relationship_type IN ('contradicts', 'supersedes', 'refines', 'related'))
);

CREATE INDEX IF NOT EXISTS idx_memory_relationships_user_created
    ON memory_relationships (user_uid, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memory_relationships_from
    ON memory_relationships (from_memory_id);

CREATE INDEX IF NOT EXISTS idx_memory_relationships_to
    ON memory_relationships (to_memory_id);

CREATE TABLE IF NOT EXISTS memory_retrieval_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid VARCHAR(255) NOT NULL,
    query_text TEXT NOT NULL,
    memory_id UUID,
    embedding_id UUID,
    source_type VARCHAR(100) NOT NULL,
    ranking_score FLOAT NOT NULL,
    vector_score FLOAT NOT NULL DEFAULT 0,
    structured_score FLOAT NOT NULL DEFAULT 0,
    recency_score FLOAT NOT NULL DEFAULT 0,
    importance_score FLOAT NOT NULL DEFAULT 0,
    confidence_score FLOAT NOT NULL DEFAULT 0,
    selected BOOLEAN NOT NULL DEFAULT false,
    token_estimate INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_memory_retrieval_user_uid FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE,
    CONSTRAINT fk_memory_retrieval_memory FOREIGN KEY (memory_id) REFERENCES conversation_memories(id) ON DELETE SET NULL,
    CONSTRAINT fk_memory_retrieval_embedding FOREIGN KEY (embedding_id) REFERENCES embeddings(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_memory_retrieval_user_created
    ON memory_retrieval_log (user_uid, created_at DESC);

ALTER TABLE embeddings
    ADD COLUMN IF NOT EXISTS domain VARCHAR(100),
    ADD COLUMN IF NOT EXISTS embedding_quality_score FLOAT NOT NULL DEFAULT 0.70,
    ADD COLUMN IF NOT EXISTS recency_weight FLOAT NOT NULL DEFAULT 0.50,
    ADD COLUMN IF NOT EXISTS importance_signal FLOAT NOT NULL DEFAULT 0.50,
    ADD COLUMN IF NOT EXISTS last_used_in_context TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_embeddings_user_domain
    ON embeddings (user_uid, domain, updated_at DESC);
