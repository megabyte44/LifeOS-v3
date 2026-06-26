-- =============================================
-- V9: Goals system
-- =============================================

CREATE TABLE goals (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid     VARCHAR(128)  NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    title        VARCHAR(500)  NOT NULL,
    category     VARCHAR(100)  NOT NULL,
    goal_type    VARCHAR(30),                      -- 'step-by-step'|'hierarchy'|'milestone'
    motive       TEXT          NOT NULL DEFAULT '',
    description  TEXT          NOT NULL DEFAULT '',
    linked_habit_ids JSONB     NOT NULL DEFAULT '[]',  -- string[]
    start_date   VARCHAR(10),                      -- 'yyyy-MM-dd'
    target_date  VARCHAR(10),
    completed_at TIMESTAMPTZ,
    archived     BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_uid ON goals(user_uid);

-- ── Progress Trackers ──
CREATE TABLE progress_trackers (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id      UUID          NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    type         VARCHAR(30)   NOT NULL,   -- 'percentage'|'fraction'|'dotChain'|...
    label        VARCHAR(255)  NOT NULL,
    current_val  DOUBLE PRECISION,
    target_val   DOUBLE PRECISION,
    stars        INT,
    max_stars    INT,
    status       VARCHAR(20),              -- ColorStatus
    total_dots   INT,
    filled_dots  INT,
    sort_order   INT           NOT NULL DEFAULT 0
);

CREATE INDEX idx_progress_trackers_goal_id ON progress_trackers(goal_id);

-- ── Sub Goals (self-referencing hierarchy) ──
CREATE TABLE sub_goals (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id      UUID          NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    parent_id    UUID          REFERENCES sub_goals(id) ON DELETE CASCADE,
    title        VARCHAR(500)  NOT NULL,
    description  TEXT,
    completed    BOOLEAN       NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    level        INT           NOT NULL DEFAULT 0,
    sort_order   INT           NOT NULL DEFAULT 0
);

CREATE INDEX idx_sub_goals_goal_id ON sub_goals(goal_id);
CREATE INDEX idx_sub_goals_parent_id ON sub_goals(parent_id);

-- ── Goal Notes ──
CREATE TABLE goal_notes (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id      UUID          NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title        VARCHAR(255)  NOT NULL,
    content      TEXT          NOT NULL DEFAULT '',
    sort_order   INT           NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goal_notes_goal_id ON goal_notes(goal_id);

-- ── Goal Resources ──
CREATE TABLE goal_resources (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id      UUID          NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    type         VARCHAR(20)   NOT NULL,   -- 'link'|'book'|'video'|'article'|'course'|'other'
    title        VARCHAR(255)  NOT NULL,
    url          TEXT,
    description  TEXT,
    sort_order   INT           NOT NULL DEFAULT 0
);

CREATE INDEX idx_goal_resources_goal_id ON goal_resources(goal_id);
