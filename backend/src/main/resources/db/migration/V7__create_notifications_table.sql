-- =============================================
-- V7: Notifications table
-- =============================================

CREATE TABLE notifications (
    id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid   VARCHAR(128)  NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    title      VARCHAR(255)  NOT NULL,
    date       VARCHAR(10)   NOT NULL,   -- 'yyyy-MM-dd'
    message    TEXT          NOT NULL,
    read       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_uid ON notifications(user_uid);
