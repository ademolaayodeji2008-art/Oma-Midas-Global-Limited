-- AlterTable: add bankCode column to User
-- Uses empty string as default so existing rows without a bank code
-- are still valid. The column should be populated via the profile-update
-- endpoint for any users created before this migration.
ALTER TABLE "User" ADD COLUMN "bankCode" TEXT NOT NULL DEFAULT '';
