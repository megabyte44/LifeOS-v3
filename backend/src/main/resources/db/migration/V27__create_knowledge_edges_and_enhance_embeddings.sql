-- =============================================================
-- V27: Knowledge Graph edges + embedding/retrieval log enhancements
-- =============================================================

-- ── 1. Universal knowledge graph: any entity → any entity ────
CREATE TABLE IF NOT EXISTS knowledge_edges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid        VARCHAR(255) NOT NULL,

    -- Source node
    from_type       VARCHAR(50)  NOT NULL,
    from_id         UUID         NOT NULL,

    -- Target node
    to_type         VARCHAR(50)  NOT NULL,
    to_id           UUID         NOT NULL,

    -- Edge metadata
    relationship    VARCHAR(50)  NOT NULL,
    confidence      FLOAT        NOT NULL DEFAULT 0.70,
    reason          TEXT,
    extraction_model VARCHAR(120),

    -- Lifecycle
    active          BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_knowledge_edges_user
        FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE,
    CONSTRAINT chk_edge_relationship CHECK (relationship IN (
        'related_to', 'supports', 'blocks', 'part_of',
        'motivated_by', 'tracks', 'contradicts', 'supersedes',
        'finances', 'scheduled_for'
    ))
);

-- Prevent duplicate active edges between the same nodes with the same relationship
CREATE UNIQUE INDEX IF NOT EXISTS uq_knowledge_edge_active
    ON knowledge_edges (user_uid, from_type, from_id, to_type, to_id, relationship)
    WHERE active = true;

-- Graph traversal: find all edges FROM a given node
CREATE INDEX IF NOT EXISTS idx_ke_from
    ON knowledge_edges (user_uid, from_type, from_id, active)
    WHERE active = true;

-- Graph traversal: find all edges TO a given node
CREATE INDEX IF NOT EXISTS idx_ke_to
    ON knowledge_edges (user_uid, to_type, to_id, active)
    WHERE active = true;

-- Relationship-type filter
CREATE INDEX IF NOT EXISTS idx_ke_user_relationship
    ON knowledge_edges (user_uid, relationship, active, created_at DESC);


-- ── 2. Add domain_tag to embeddings for richer source-type filtering ──
ALTER TABLE embeddings
    ADD COLUMN IF NOT EXISTS domain_tag VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_embeddings_domain_tag
    ON embeddings (user_uid, domain_tag)
    WHERE domain_tag IS NOT NULL;


-- ── 3. Enhance retrieval log with graph score and query intent ──
ALTER TABLE memory_retrieval_log
    ADD COLUMN IF NOT EXISTS graph_score FLOAT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS query_intent VARCHAR(100);
