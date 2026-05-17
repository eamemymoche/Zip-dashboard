-- Migration: Add per-user module access storage
-- Idempotent: safe to run multiple times

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "moduleAccessJson" TEXT;
