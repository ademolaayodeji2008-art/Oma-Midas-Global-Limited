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
      value: '10',
    },
    {
      key: 'loan_multiplier',
      value: '2',
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
      key: 'dividend_rate',
      value: '5',
    },
    {
      key: 'deduction_return_rate',
      value: '10',
    },
    {
      key: 'coop_bank_name',
      value: 'First Bank of Nigeria',
    },
    {
      key: 'coop_account_number',
      value: '0000000000',
    },
    {
      key: 'coop_account_name',
      value: 'Oma Midas Global Limited',
    },
    {
      key: 'terms_and_conditions',
      value: `<h2>Welcome to OMA MIDAS Savings Program</h2>
<p>We're excited to have you on board! This program aims to promote financial discipline, savings, and responsible lending partnership.</p>

<h3>Membership Requirements</h3>
<ol>
<li>Membership is open to individuals with a high level of integrity and financial competence with a legitimate source of income.</li>
<li>Registration is free and the program aims to support you in achieving your goals.</li>
</ol>

<h3>Savings Requirements</h3>
<ol>
<li><strong>Monthly savings:</strong> This is the minimum amount filled out in your registration form.</li>
<li>Payments can be made between the 1st and last day of every month.</li>
</ol>

<h3>Loan Requests</h3>
<ol>
<li>Loan requests must be submitted and approved before the 25th of every month.</li>
<li>Disbursement of approved loans occurs on the last day of every month.</li>
</ol>

<h3>Additional Rules</h3>
<ol>
<li><strong>Interest rate:</strong> 10% of loaned funds on all loans.</li>
<li><strong>Loan repayment term:</strong> All loans must be returned before the end of the savings cycle (September 30). Repayments are distributed across the remaining months of the cycle.</li>
<li><strong>Default penalty:</strong> Your guarantor may risk forfeiting their savings. Other members' savings cannot be placed at risk.</li>
<li><strong>Maximum loan amount:</strong> Two (2) times your total saved amount, or the total capacity of your guarantor.</li>
<li>Members are advised to attend at least one virtual financial literacy seminar during the savings cycle.</li>
</ol>

<h3>Benefits</h3>
<ol>
<li>Fair interest rates on savings.</li>
<li>Access to affordable loans.</li>
<li>Financial literacy resources.</li>
<li>Community support.</li>
<li>Dividends at the end of the financial cycle.</li>
<li>Financial literacy empowerment.</li>
</ol>

<h3>Termination</h3>
<ol>
<li>Failure to make monthly savings for 2 consecutive months will result in a red flag on your account.</li>
<li>Integrity is key. Defaulting on payments affects your eligibility for future cycles and disqualifies you from being a guarantor.</li>
<li>Defaulting on loan repayment is taken seriously. Adequate measures are in place to recover funds where necessary.</li>
</ol>

<h3>Commitment</h3>
<p>By joining this platform, you commit to adhering to these rules and guidelines.</p>

<h3>Contact Us</h3>
<p>For inquiries, support or concerns:</p>
<p><strong>Email:</strong> omamidasgloballtd@gmail.com<br/>
<strong>WhatsApp:</strong> +2347016694445</p>

<p>Thank you for choosing Oma Midas Savings platform!<br/>
<em>Best regards,<br/>Ajiboye O.M<br/>OMA Midas Savings Program Secretary</em></p>`,
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
  // Determine the current cycle year: if today is Oct 1 or later, cycle starts
  // this year; otherwise it started last year (Oct 1 to Sep 30).
  const today = new Date();
  const cycleStartYear = today.getMonth() >= 9 // October = month index 9
    ? today.getFullYear()
    : today.getFullYear() - 1;
  const cycleEndYear = cycleStartYear + 1;
  const cycleId = `seed-cycle-${cycleStartYear}-${cycleEndYear}`;

  await prisma.cycle.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  const cycle = await prisma.cycle.upsert({
    where: { id: cycleId },
    update: { isActive: true },
    create: {
      id: cycleId,
      startDate: new Date(`${cycleStartYear}-10-01`),
      endDate: new Date(`${cycleEndYear}-09-30`),
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
