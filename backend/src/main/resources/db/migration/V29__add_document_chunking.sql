-- Phase 1: Document Chunking Pipeline
-- Adds chunk metadata columns to the embeddings table so long documents
-- can be split into overlapping chunks before embedding.

ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS chunk_index     INTEGER DEFAULT 0;
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS total_chunks    INTEGER DEFAULT 1;
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS parent_source_id UUID;
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS chunk_start_char INTEGER;
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS chunk_end_char   INTEGER;

-- Fast lookup of all chunks that belong to a parent document
CREATE INDEX IF NOT EXISTS idx_embeddings_parent_chunks
    ON embeddings (user_uid, source_type, parent_source_id, chunk_index)
    WHERE parent_source_id IS NOT NULL;
