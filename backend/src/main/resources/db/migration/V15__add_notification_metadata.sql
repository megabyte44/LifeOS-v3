ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS source_type VARCHAR(64),
    ADD COLUMN IF NOT EXISTS source_id VARCHAR(128),
    ADD COLUMN IF NOT EXISTS action_url VARCHAR(512);

CREATE INDEX IF NOT EXISTS idx_notifications_source_type ON notifications(source_type);