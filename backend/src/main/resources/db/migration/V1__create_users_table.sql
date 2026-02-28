-- =============================================
-- V1: Create users table
-- =============================================
-- This is the root table. Every other table references users.uid
-- The uid comes from Firebase Authentication (not auto-generated).

CREATE TABLE users (
    uid          VARCHAR(128)  PRIMARY KEY,          -- Firebase UID (e.g. "aBcDeFgHiJkLmN")
    email        VARCHAR(255)  NOT NULL,
    display_name VARCHAR(255),
    photo_url    TEXT,
    role         VARCHAR(20)   NOT NULL DEFAULT 'user',  -- 'user' or 'admin'
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index for quick email lookups
CREATE INDEX idx_users_email ON users(email);
