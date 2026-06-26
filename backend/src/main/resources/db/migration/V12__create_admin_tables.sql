-- V12: Admin module — global singleton tables

-- AI Configuration (global singleton — only one row)
CREATE TABLE ai_configurations (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    system_instructions JSONB           NOT NULL DEFAULT '{"casualBuddy":"","professionalAssistant":""}',
    default_personality VARCHAR(20)     NOT NULL DEFAULT 'casual',
    model_config        JSONB           NOT NULL DEFAULT '{"provider":"openrouter","model":"","temperature":0.7,"maxTokens":4096,"topP":1.0}',
    api_keys            JSONB           NOT NULL DEFAULT '{}',
    rag_enabled         BOOLEAN         NOT NULL DEFAULT FALSE,
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_by          VARCHAR(128)    NOT NULL DEFAULT ''
);

-- System Settings (global singleton — only one row)
CREATE TABLE system_settings (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    features    JSONB       NOT NULL DEFAULT '{"aiChat":true,"pushNotifications":true,"waterTracker":true,"gymTracker":true,"passwordManager":true,"budgetTracker":true,"habitTracker":true,"planner":true}',
    maintenance JSONB       NOT NULL DEFAULT '{"enabled":false,"message":""}',
    limits      JSONB       NOT NULL DEFAULT '{"maxNotesPerUser":500,"maxTodosPerUser":500,"maxAiMessagesPerDay":50}',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  VARCHAR(128) NOT NULL DEFAULT ''
);

-- Announcements (global CRUD)
CREATE TABLE announcements (
    id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    title        VARCHAR(500)    NOT NULL,
    content      TEXT            NOT NULL DEFAULT '',
    type         VARCHAR(20)     NOT NULL DEFAULT 'info',    -- 'info'|'warning'|'success'|'update'
    version      VARCHAR(50),
    published    BOOLEAN         NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by   VARCHAR(128)    NOT NULL DEFAULT ''
);

-- About Page (global singleton — only one row)
CREATE TABLE about_page (
    id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(500)    NOT NULL DEFAULT 'LifeOS',
    description      TEXT            NOT NULL DEFAULT '',
    version          VARCHAR(50)     NOT NULL DEFAULT '1.0.0',
    markdown_content TEXT,
    features         JSONB           NOT NULL DEFAULT '[]',
    contact          JSONB           NOT NULL DEFAULT '{}',
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_by       VARCHAR(128)    NOT NULL DEFAULT ''
);
