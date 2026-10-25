# Multiple Contributions Per Month Feature

## Overview
Members can now save multiple times within the same month based on their convenience. This flexible contribution system allows daily, weekly, or custom-frequency savings.

## Changes Made

### 1. Database Schema Update
**File:** `server/src/prisma/schema.prisma`
- **Removed:** Unique constraint `@@unique([userId, cycleId, month, year])`
- **Added:** Index `@@index([userId, cycleId, month, year])` for performance
- **Added:** Index `@@index([submittedAt])` for better sorting

**Migration:** `server/src/prisma/migrations/002_allow_multiple_contributions_per_month.sql`
```sql
DROP INDEX IF EXISTS "Contribution_userId_cycleId_month_year_key";
CREATE INDEX IF NOT EXISTS "Contribution_userId_cycleId_month_year_idx" 
ON "Contribution"("userId", "cycleId", "month", "year");
CREATE INDEX IF NOT EXISTS "Contribution_submittedAt_idx" 
ON "Contribution"("submittedAt");
```

### 2. API Changes

#### `submitPayment()` - Allow Multiple Contributions
**Before:** Checked for existing contribution and rejected/updated
**After:** Always creates NEW contribution entry

```javascript
// Now allows multiple contributions per month
await prisma.contribution.create({
  data: {
    userId: req.user.id,
    cycleId: cycle.id,
    month,
    year,
    amountKobo: minAmount,
    status: 'PENDING_CONFIRMATION',
    amountSubmittedKobo: amountKobo,
    paymentNote: paymentNote || null,
    submittedAt: now,
  },
});
```

#### `getContributionStatus()` - Return All Contributions
**Before:** Returned single contribution
**After:** Returns array of all contributions for the month with totals

```javascript
{
  month: 10,
  year: 2026,
  status: 'PAID',
  contributions: [...], // Array of all contributions
  totalPaidKobo: 1000000, // Sum of all paid contributions
  contributionCount: 3 // Number of contributions this month
}
```

## Benefits

### For Members
✅ **Flexible Saving:** Save whenever you have money (daily, weekly, bi-weekly)
✅ **No Limits:** No restriction on number of contributions per month
✅ **Track Progress:** See all individual contributions in history
✅ **Convenience:** Contribute based on cash flow, not calendar

### For Admin
✅ **Better Tracking:** Each contribution is a separate record
✅ **Accurate Ledger:** Every payment creates a unique ledger entry
✅ **Easy Audit:** Clear trail of when each payment was made
✅ **Flexible Approval:** Approve each contribution individually

## Loan Repayment

The same flexibility applies to loan repayments:
- Members can make partial repayments anytime
- Multiple installment payments per month allowed
- Each payment tracked separately in ledger
- Outstanding balance updates after each payment

## How It Works

### Member Flow
1. Navigate to Contributions page
2. Click "Make Payment" (can do this daily if desired)
3. Enter amount (minimum monthly amount required)
4. Submit bank transfer proof
5. Admin confirms payment
6. Ledger entry created immediately after approval
7. Balance updated in real-time

### Example Scenarios

**Scenario 1: Daily Savings**
- Oct 1: ₦2,000
- Oct 8: ₦1,500
- Oct 15: ₦3,000
- Oct 22: ₦2,500
- **Total October:** ₦9,000

**Scenario 2: Bi-weekly**
- Oct 1: ₦5,000
- Oct 15: ₦5,000
- **Total October:** ₦10,000

**Scenario 3: Single Monthly**
- Oct 1: ₦10,000
- **Total October:** ₦10,000

All three scenarios are valid and tracked identically!

## Technical Details

### Ledger Entry Creation
Each approved contribution creates a NEW ledger entry:
```javascript
await appendLedgerEntry(tx, {
  type: 'CONTRIBUTION',
  ledger: 'SAVINGS',
  userId: contribution.userId,
  amountKobo,
  reference: generateLedgerReference('CONTRIBUTION', id),
});
```

### Transaction History
Members see ALL their contributions in:
- `/api/member/transactions` - Complete transaction history
- Filterable by date range
- CSV export available
- Shows running balance after each contribution

## Migration Instructions

### To Apply This Update:

1. **Backup Database:**
   ```bash
   # Production backup
   pg_dump $DATABASE_URL > backup_before_multiple_contributions.sql
   ```

2. **Run Migration:**
   ```bash
   # On production database
   psql $DATABASE_URL < server/src/prisma/migrations/002_allow_multiple_contributions_per_month.sql
   ```

3. **Deploy Code:**
   - Backend will auto-deploy from GitHub
   - Frontend will auto-deploy from GitHub

4. **Verify:**
   - Test member can submit multiple contributions
   - Check ledger entries are created correctly
   - Verify transaction history shows all contributions

## Testing Checklist

- [ ] Member can submit first contribution for October
- [ ] Member can submit SECOND contribution for October (same month)
- [ ] Both contributions appear in history
- [ ] Admin can approve both independently
- [ ] Ledger shows correct running balance
- [ ] Transaction page shows both entries
- [ ] Total savings calculation is correct
- [ ] Clearance card shows all contributions

## Notes

- Minimum contribution amount still enforced per submission
- Each contribution needs admin approval
- Rejected contributions don't affect other submissions
- Streak counter counts months with at least one PAID contribution
