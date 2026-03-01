-- =============================================
-- V8: User Preferences (singleton per user)
-- =============================================

CREATE TABLE preferences (
    id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid   VARCHAR(128)  NOT NULL UNIQUE REFERENCES users(uid) ON DELETE CASCADE,
    features   JSONB         NOT NULL DEFAULT '{}',
    onboarding JSONB
);
