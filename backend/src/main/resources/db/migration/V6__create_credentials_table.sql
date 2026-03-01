-- =============================================
-- V6: Credentials (Password Vault)
-- =============================================
-- Sensitive fields (password, pins, account numbers) are AES-256 encrypted
-- at the application layer before being stored here.

CREATE TABLE credentials (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uid              VARCHAR(128)  NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    name                  VARCHAR(255)  NOT NULL,
    category              VARCHAR(50)   NOT NULL,   -- 'Website'|'Banking'|'Social Media'|'Other'
    last_updated          VARCHAR(10)   NOT NULL,   -- 'yyyy-MM-dd'
    -- Generic fields
    username              TEXT,
    password              TEXT,                     -- encrypted
    website               TEXT,
    -- Banking fields (all encrypted if present)
    account_number        TEXT,
    ifsc_code             TEXT,
    upi_pin               TEXT,
    netbanking_id         TEXT,
    mpin                  TEXT,
    netbanking_password   TEXT,
    transaction_password  TEXT
);

CREATE INDEX idx_credentials_user_uid ON credentials(user_uid);
