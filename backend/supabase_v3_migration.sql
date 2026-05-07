-- V3 Migration: Gemini usage tracking per user
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS tokens_in  BIGINT DEFAULT 0;
ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS tokens_out BIGINT DEFAULT 0;
ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS cost_usd   NUMERIC(10,6) DEFAULT 0;
