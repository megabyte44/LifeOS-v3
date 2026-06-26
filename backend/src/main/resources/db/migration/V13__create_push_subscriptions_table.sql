-- V13: Push subscriptions table for Web Push (VAPID)

CREATE TABLE push_subscriptions (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid    VARCHAR(128)    NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    endpoint    TEXT            NOT NULL UNIQUE,
    p256dh      TEXT            NOT NULL,
    auth        TEXT            NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_user_uid ON push_subscriptions(user_uid);
