-- V28: Persistent conversation grouping for AI chat (ChatGPT-like)

-- ── 1. Conversation headers table ─────────────────────────────────────────────
CREATE TABLE ai_conversations (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid         VARCHAR(255) NOT NULL,
    title            VARCHAR(500) NOT NULL DEFAULT 'New Chat',
    personality      VARCHAR(50),
    mode             VARCHAR(50)  NOT NULL DEFAULT 'normal',
    last_message_at  TIMESTAMP WITH TIME ZONE,            -- NULL = orphan, hidden from sidebar
    deleted          BOOLEAN      NOT NULL DEFAULT false,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_conversations_user
        FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- Sidebar query index: non-deleted, has messages, newest first
CREATE INDEX idx_ai_conv_user_active
    ON ai_conversations (user_uid, last_message_at DESC)
    WHERE deleted = false AND last_message_at IS NOT NULL;

-- ── 2. Link chat history rows to conversations (nullable, backward-compatible) ──
ALTER TABLE ai_chat_history
    ADD COLUMN conversation_id UUID,
    ADD CONSTRAINT fk_ai_chat_history_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES ai_conversations(id)
        ON DELETE SET NULL;

CREATE INDEX idx_ai_chat_history_conversation
    ON ai_chat_history (conversation_id, created_at ASC)
    WHERE conversation_id IS NOT NULL;
