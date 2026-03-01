-- =============================================
-- V4: Habits table
-- =============================================

CREATE TABLE habits (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid         VARCHAR(128)  NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    name             VARCHAR(255)  NOT NULL,
    icon             VARCHAR(100)  NOT NULL,
    target           INT,                          -- optional daily target
    completions      JSONB         NOT NULL DEFAULT '{}',  -- Record<date, boolean|number>
    habit_type       VARCHAR(20),                  -- 'repetitive' | 'sprint'
    sprint_duration  INT,
    sprint_end_date  VARCHAR(10),                  -- 'yyyy-MM-dd'
    sprint_start_date VARCHAR(10),                 -- 'yyyy-MM-dd'
    context          VARCHAR(50),                  -- 'gym' or null
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_habits_user_uid ON habits(user_uid);
