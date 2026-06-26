CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid VARCHAR(255) NOT NULL UNIQUE,
    age INT,
    bio TEXT,
    philosophy TEXT,
    interests JSONB DEFAULT '[]'::jsonb,
    sleep_target_hours FLOAT,
    daily_calorie_target INT,
    protein_target_override INT,
    occupation VARCHAR(255),
    timezone VARCHAR(255),
    life_motto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_profiles_user_uid FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE INDEX idx_user_profiles_user_uid ON user_profiles(user_uid);
