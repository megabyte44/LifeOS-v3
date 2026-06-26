CREATE TABLE conversation_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid VARCHAR(255) NOT NULL,
    memory_text TEXT NOT NULL,
    source_conversation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(100),
    confidence FLOAT,
    superseded_by UUID,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_memories_user_uid FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE,
    CONSTRAINT fk_memories_superseded FOREIGN KEY (superseded_by) REFERENCES conversation_memories(id) ON DELETE SET NULL
);

CREATE INDEX idx_memories_user_active_created ON conversation_memories (user_uid, active, created_at DESC);
