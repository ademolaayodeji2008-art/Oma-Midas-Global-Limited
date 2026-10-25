-- Migration: Allow multiple contributions per month
-- Remove the unique constraint that limits one contribution per month
-- Members can now save multiple times in the same month (daily, weekly, etc.)

-- Drop the unique constraint
DROP INDEX IF EXISTS "Contribution_userId_cycleId_month_year_key";

-- Add index for better query performance (non-unique)
CREATE INDEX IF NOT EXISTS "Contribution_userId_cycleId_month_year_idx" 
ON "Contribution"("userId", "cycleId", "month", "year");

-- Add index on submittedAt for better sorting
CREATE INDEX IF NOT EXISTS "Contribution_submittedAt_idx" 
ON "Contribution"("submittedAt");
