-- Enhance user_profiles for dynamic AI-driven profile building.
-- Bio, philosophy, interests are now populated by AI extraction from
-- LifeOS data sources and conversations — not manual user input.

ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS profile_completeness  INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_enriched_at       TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS enrichment_sources     JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS pending_questions      JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS life_summary           TEXT;

-- profile_completeness  — 0-100 score indicating how much the AI knows
-- last_enriched_at      — when the profile was last auto-enriched
-- enrichment_sources    — e.g. {"chat": 5, "notes": 3, "goals": 2, "buddy": 4}
-- pending_questions     — questions the Chat Buddy still wants to ask
-- life_summary          — short narrative paragraph synthesised from all sources
