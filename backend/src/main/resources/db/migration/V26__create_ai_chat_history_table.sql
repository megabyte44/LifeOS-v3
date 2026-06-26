CREATE TABLE ai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid VARCHAR(255) NOT NULL,
    mode VARCHAR(50) NOT NULL DEFAULT 'normal',
    personality VARCHAR(50),
    provider VARCHAR(50),
    model VARCHAR(255),
    user_message TEXT NOT NULL,
    assistant_message TEXT NOT NULL,
    request_messages JSONB,
    response_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_chat_history_user_uid FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE INDEX idx_ai_chat_history_user_created
    ON ai_chat_history (user_uid, created_at DESC);

CREATE INDEX idx_ai_chat_history_mode_created
    ON ai_chat_history (mode, created_at DESC);
