-- Migration: Add SUPERADMIN role and active field to User
-- Idempotent: safe to run on top of existing schema

-- 1. Add SUPERADMIN to UserRole enum (if not already present)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole' AND NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUPERADMIN')) THEN
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPERADMIN';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add active column to User table (if not already present)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "active" Boolean NOT NULL DEFAULT true;

-- 3. Update existing users to active=true so they remain visible
UPDATE "User" SET "active" = true WHERE "active" IS NULL;