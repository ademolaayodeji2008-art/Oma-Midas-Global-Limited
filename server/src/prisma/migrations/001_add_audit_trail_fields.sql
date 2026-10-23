-- Migration: Add audit trail fields to Contribution and LoanInstallment tables
-- Date: 2026-10-23
-- Description: Preserves rejection history for better audit trail and dispute resolution

BEGIN;

-- Add rejection tracking fields to Contribution table
ALTER TABLE "Contribution" 
  ADD COLUMN IF NOT EXISTS "rejectedAmountKobo" INTEGER,
  ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "rejectionCount" INTEGER NOT NULL DEFAULT 0;

-- Add rejection history tracking to LoanInstallment table
ALTER TABLE "LoanInstallment"
  ADD COLUMN IF NOT EXISTS "rejectionHistory" JSONB,
  ADD COLUMN IF NOT EXISTS "lastRejectedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejectionCount" INTEGER NOT NULL DEFAULT 0;

COMMIT;
