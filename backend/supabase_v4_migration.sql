-- V4 Migration: Replace access codes with email-based auth (Supabase OTP)
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Create allowed_users table (replaces access_codes for auth)
CREATE TABLE IF NOT EXISTS allowed_users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email        TEXT UNIQUE NOT NULL,
    name         TEXT,
    country      TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ,
    is_active    BOOLEAN DEFAULT true,
    messages_sent INT DEFAULT 0,
    tokens_in    BIGINT DEFAULT 0,
    tokens_out   BIGINT DEFAULT 0,
    cost_usd     NUMERIC(10,6) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_allowed_users_email ON allowed_users(email);

-- 2. Add user_email column to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_email TEXT;
CREATE INDEX IF NOT EXISTS idx_conversations_user_email ON conversations(user_email);

-- 3. Migrate existing conversations (copy email from access_codes)
UPDATE conversations c
SET user_email = (
    SELECT email FROM access_codes ac WHERE ac.code = c.access_code
)
WHERE user_email IS NULL AND access_code IS NOT NULL;

-- 4. Migrate existing users from access_codes into allowed_users
INSERT INTO allowed_users (email, name, country, created_at, is_active, messages_sent, tokens_in, tokens_out, cost_usd)
SELECT DISTINCT
    email,
    name,
    country,
    created_at,
    is_active,
    messages_sent,
    COALESCE(tokens_in, 0),
    COALESCE(tokens_out, 0),
    COALESCE(cost_usd, 0)
FROM access_codes
WHERE email IS NOT NULL AND email != ''
ON CONFLICT (email) DO NOTHING;
