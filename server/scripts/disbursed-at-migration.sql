-- Add disbursedAt timestamp to Loan table (recorded when admin marks loan as disbursed)
-- Run this SQL in Supabase SQL editor before deploying, then run
-- 'npx prisma generate' in the server/ directory to regenerate the Prisma client.
ALTER TABLE "Loan" ADD COLUMN IF NOT EXISTS "disbursedAt" TIMESTAMP(3);
