-- V2 Migration: Access codes + conversation ownership
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Create access_codes table
CREATE TABLE IF NOT EXISTS access_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,
  name          TEXT,
  email         TEXT,
  country       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT true,
  messages_sent INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);

-- 2. Add access_code column to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS access_code TEXT REFERENCES access_codes(code) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_conversations_access_code ON conversations(access_code);

-- 3. (Optional) Seed a test access code for development
-- INSERT INTO access_codes (code, name, email, country) VALUES ('RT66-TEST-0001', 'Test User', 'test@example.com', 'USA');
