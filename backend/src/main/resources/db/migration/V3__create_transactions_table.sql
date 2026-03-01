-- =============================================
-- V3: Transactions + Budgets
-- =============================================

CREATE TABLE transactions (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid    VARCHAR(128)  NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    date        DATE          NOT NULL,
    description VARCHAR(500)  NOT NULL,
    category    VARCHAR(100)  NOT NULL,
    amount      BIGINT        NOT NULL,   -- stored in cents
    type        VARCHAR(10)   NOT NULL,   -- 'income', 'expense', 'fee'
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_uid ON transactions(user_uid);
CREATE INDEX idx_transactions_date ON transactions(user_uid, date);

-- One budget row per user (singleton)
CREATE TABLE budgets (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid    VARCHAR(128)  NOT NULL UNIQUE REFERENCES users(uid) ON DELETE CASCADE,
    budget      BIGINT        NOT NULL DEFAULT 0   -- monthly budget in cents
);
