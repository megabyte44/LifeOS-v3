-- pgvector not available locally; skipping extension creation
-- CREATE EXTENSION IF NOT EXISTS vector;
DO $$ BEGIN RAISE NOTICE 'pgvector extension skipped (not installed locally)'; END $$;