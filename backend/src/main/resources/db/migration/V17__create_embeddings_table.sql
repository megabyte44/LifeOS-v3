-- pgvector not available locally; using TEXT column instead of vector(1536)
CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid VARCHAR(255) NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    source_id UUID NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    content_preview TEXT,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_embeddings_user_uid FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE INDEX idx_embeddings_user_source ON embeddings(user_uid, source_type);
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);