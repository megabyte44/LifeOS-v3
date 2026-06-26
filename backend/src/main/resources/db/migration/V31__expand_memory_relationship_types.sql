-- Expand memory_relationships constraint to include the three Supermemory-style
-- canonical relation types used by the graph-aware extraction pipeline.
--
-- New types:
--   updates  → new fact replaces/contradicts an older memory (sets old isLatest=false)
--   extends  → new fact adds detail to an existing memory (both stay isLatest=true)
--   derives  → inferred connection linking two or more existing memories
--
-- Legacy types kept for backward compatibility with existing rows.

ALTER TABLE memory_relationships
    DROP CONSTRAINT IF EXISTS chk_memory_relationship_type;

ALTER TABLE memory_relationships
    ADD CONSTRAINT chk_memory_relationship_type CHECK (
        relationship_type IN (
            'updates', 'extends', 'derives',
            'supersedes', 'contradicts', 'refines', 'related'
        )
    );
