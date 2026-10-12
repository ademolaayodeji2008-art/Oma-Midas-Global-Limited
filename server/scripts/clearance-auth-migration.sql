-- Clearance Card Authorization Migration
-- Run this in your Supabase SQL editor.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clearanceAuthorized" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clearanceRequestedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clearanceDeniedReason" TEXT;
