-- Run this against the production database to apply the new business rules.
UPDATE "Setting" SET "value" = '2' WHERE "key" = 'loan_multiplier';
