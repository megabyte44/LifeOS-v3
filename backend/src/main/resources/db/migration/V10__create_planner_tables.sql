-- V10: Planner items table

CREATE TABLE planner_items (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid    VARCHAR(128)    NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    day         VARCHAR(100)    NOT NULL,   -- 'Monday' | 'Tuesday' | etc | or a date string
    start_time  VARCHAR(5)      NOT NULL,   -- 'HH:mm'
    end_time    VARCHAR(5)      NOT NULL,   -- 'HH:mm'
    title       VARCHAR(500)    NOT NULL,
    tag         VARCHAR(100)
);

CREATE INDEX idx_planner_items_user_uid ON planner_items(user_uid);
CREATE INDEX idx_planner_items_user_day ON planner_items(user_uid, day);
