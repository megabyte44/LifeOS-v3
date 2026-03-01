-- V11: Gym module tables

-- Singleton: Workout Split (JSONB blob — entire CyclicalWorkoutSplit map)
CREATE TABLE workout_splits (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid    VARCHAR(128)    NOT NULL UNIQUE REFERENCES users(uid) ON DELETE CASCADE,
    split       JSONB           NOT NULL DEFAULT '{}'
);

-- Singleton: Cycle Config
CREATE TABLE cycle_configs (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid        VARCHAR(128)    NOT NULL UNIQUE REFERENCES users(uid) ON DELETE CASCADE,
    start_date      VARCHAR(10)     NOT NULL DEFAULT '',
    start_day_key   VARCHAR(100)    NOT NULL DEFAULT ''
);

-- CRUD: Protein Intakes
CREATE TABLE protein_intakes (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid    VARCHAR(128)    NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    amount      INTEGER         NOT NULL,       -- grams
    timestamp   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_protein_intakes_user_uid ON protein_intakes(user_uid);

-- CRUD: Food Log
CREATE TABLE food_log (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid    VARCHAR(128)    NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    name        VARCHAR(255)    NOT NULL,
    timestamp   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_food_log_user_uid ON food_log(user_uid);

-- Singleton: Completed Workouts (JSONB map: date → boolean)
CREATE TABLE gym_completions (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid    VARCHAR(128)    NOT NULL UNIQUE REFERENCES users(uid) ON DELETE CASCADE,
    completions JSONB           NOT NULL DEFAULT '{}'
);

-- Singleton: Custom Foods (JSONB array of strings)
CREATE TABLE custom_foods (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid    VARCHAR(128)    NOT NULL UNIQUE REFERENCES users(uid) ON DELETE CASCADE,
    foods       JSONB           NOT NULL DEFAULT '[]'
);

-- Singleton: Protein Target (integer, grams)
CREATE TABLE protein_targets (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid    VARCHAR(128)    NOT NULL UNIQUE REFERENCES users(uid) ON DELETE CASCADE,
    target      INTEGER         NOT NULL DEFAULT 150
);
