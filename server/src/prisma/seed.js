/**
 * Oma Midas Global Limited — Database Seed Script
 * Run from server/: node src/prisma/seed.js
 *
 * Seeds:
 *  1. Admin user
 *  2. Application settings
 *  3. Active cooperative cycle
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // -------------------------------------------------------------------------
  // 1. Admin user
  // -------------------------------------------------------------------------
  const adminEmail = 'admin@omamidas.com';
  const adminPassword = 'Admin@Midas2024!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: 'ADMIN', status: 'ACTIVE' },
    create: {
      fullName: 'Oma Midas Admin',
      email: adminEmail,
      phone: '08000000000',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      memberType: 'EXISTING',
      bankName: 'Admin Bank',
      accountNumber: '0000000000',
      accountName: 'Oma Midas Admin',
    },
  });

  console.log(`✓ Admin user upserted: ${admin.email}`);

  // -------------------------------------------------------------------------
  // 2. Application settings
  // -------------------------------------------------------------------------
  const settings = [
    {
      key: 'fee_percentage',
      value: '30',
    },
    {
      key: 'loan_multiplier',
      value: '3',
    },
    {
      key: 'min_consecutive_months',
      value: '3',
    },
    {
      key: 'monthly_amount',
      value: '500000',
    },
    {
      key: 'terms_and_conditions',
      value: `<p>Terms and conditions for Oma Midas Global Limited cooperative membership.</p>
<p>By registering as a member, you agree to contribute a fixed monthly amount to the cooperative savings pool. Your contributions form the basis of your eligibility for cooperative loans.</p>
<p>Loans are subject to approval by the cooperative administrator. A service fee is deducted from the approved loan amount before disbursement. The full approved amount (before the fee) is repayable in equal monthly installments over the agreed repayment period.</p>
<p>Members must maintain their contributions for a minimum number of consecutive months before becoming eligible to request a loan. The cooperative reserves the right to amend these terms with reasonable notice to all members.</p>
<p>Refunds of savings contributions may be requested at the end of a cooperative cycle, subject to any outstanding loan obligations. All financial transactions are processed through Paystack and are subject to their terms of service.</p>
<p>Oma Midas Global Limited is committed to the financial wellbeing of its members and operates with full transparency. For queries, contact the cooperative administrator.</p>`,
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
    console.log(`✓ Setting upserted: ${setting.key}`);
  }

  // -------------------------------------------------------------------------
  // 3. Active cooperative cycle
  // -------------------------------------------------------------------------
  // Deactivate any previously active cycles before creating/activating the new one
  await prisma.cycle.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  const cycle = await prisma.cycle.upsert({
    where: {
      // Upsert by a unique combination — we create a deterministic id for the seed cycle
      id: 'seed-cycle-2024-2025',
    },
    update: { isActive: true },
    create: {
      id: 'seed-cycle-2024-2025',
      startDate: new Date('2024-10-01'),
      endDate: new Date('2025-09-30'),
      isActive: true,
    },
  });

  console.log(`✓ Active cycle upserted: ${cycle.startDate.toISOString().slice(0, 10)} — ${cycle.endDate.toISOString().slice(0, 10)}`);

  console.log('\nSeed complete');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
