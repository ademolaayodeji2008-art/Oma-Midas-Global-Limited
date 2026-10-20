-- =============================================================================
-- Oma Midas Global Limited — Manual Bank Transfer Contribution Migration
-- Run this SQL in the Supabase SQL editor.
-- =============================================================================

-- Add PENDING_CONFIRMATION to the ContributionStatus enum
ALTER TYPE "ContributionStatus" ADD VALUE IF NOT EXISTS 'PENDING_CONFIRMATION';

-- Add new columns to the Contribution table
ALTER TABLE "Contribution" ADD COLUMN IF NOT EXISTS "amountSubmittedKobo" INTEGER;
ALTER TABLE "Contribution" ADD COLUMN IF NOT EXISTS "paymentNote" TEXT;
ALTER TABLE "Contribution" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Contribution" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
