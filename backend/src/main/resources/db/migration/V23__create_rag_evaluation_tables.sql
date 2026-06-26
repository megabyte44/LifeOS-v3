CREATE TABLE rag_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    retrieved_contexts JSONB DEFAULT '[]'::jsonb,
    faithfulness FLOAT,
    answer_relevancy FLOAT,
    context_precision FLOAT,
    model_used VARCHAR(255),
    personality VARCHAR(50),
    context_token_count INT,
    response_time_ms BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rag_eval_user FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE INDEX idx_rag_evaluations_created ON rag_evaluations (created_at DESC);
CREATE INDEX idx_rag_evaluations_user_created ON rag_evaluations (user_uid, created_at DESC);

CREATE TABLE rag_test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    expected_answer TEXT NOT NULL,
    category VARCHAR(100),
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
