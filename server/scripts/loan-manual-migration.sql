-- Run this SQL in Supabase SQL editor
ALTER TYPE "InstallmentStatus" ADD VALUE IF NOT EXISTS 'PENDING_CONFIRMATION';
ALTER TABLE "LoanInstallment" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "LoanInstallment" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
