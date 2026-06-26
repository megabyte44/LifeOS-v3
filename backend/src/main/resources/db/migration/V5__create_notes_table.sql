-- =============================================
-- V5: Notes table
-- =============================================
-- content is JSONB to support polymorphic types:
--   text/markdown: a JSON string  → "\"some text\""
--   checklist:     a JSON array   → [{text, completed}, ...]
--   snippet:       a JSON object  → {code, language, input?, output?}

CREATE TABLE notes (
    id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid   VARCHAR(128)  NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    title      VARCHAR(500)  NOT NULL,
    content    JSONB         NOT NULL DEFAULT 'null',
    type       VARCHAR(20)   NOT NULL,   -- 'text' | 'checklist' | 'markdown' | 'snippet'
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_user_uid ON notes(user_uid);
