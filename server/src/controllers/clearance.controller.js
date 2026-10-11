/**
 * clearance.controller.js — Monthly Clearance Card endpoints.
 *
 * GET /api/clearance-card        → getMyClearanceCard (member)
 * GET /api/clearance-card/admin/:id → getAdminMemberClearanceCard (admin)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// buildClearanceCard — shared helper for both endpoints
// ---------------------------------------------------------------------------
async function buildClearanceCard(userId) {
  // (a) Fetch the user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true,
      memberType: true,
      status: true,
    },
  });

  if (!user) return { notFound: true };

  // (b) Build member number
  const joinYear = user.createdAt.getFullYear();
  const yearStart = new Date(`${joinYear}-01-01T00:00:00.000Z`);
  const yearEnd   = new Date(`${joinYear}-12-31T23:59:59.999Z`);

  const countBefore = await prisma.user.count({
    where: {
      role: 'MEMBER',
      createdAt: {
        gte: yearStart,
        lt:  user.createdAt,
      },
    },
  });

  const sequence = String(countBefore + 1).padStart(2, '0');
  const twoDigitYear = String(joinYear).slice(-2);
  const memberNumber = `OMA${twoDigitYear}${sequence}`;

  // (c) Active cycle
  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) return { noCycle: true };

  // (d) PAID contributions for this user in this cycle, ordered by month asc
  const contributions = await prisma.contribution.findMany({
    where: { userId, cycleId: cycle.id, status: 'PAID' },
    orderBy: { month: 'asc' },
  });

  // (e) Loan installments (PAID) for this user's loans in this cycle
  const loans = await prisma.loan.findMany({
    where: { userId, cycleId: cycle.id },
    include: {
      installments: {
        where: { status: 'PAID' },
        orderBy: { dueDate: 'asc' },
      },
    },
  });

  // (f) Fetch dividend_rate and deduction_return_rate settings
  const [dividendSetting, deductionReturnSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'dividend_rate' } }),
    prisma.setting.findUnique({ where: { key: 'deduction_return_rate' } }),
  ]);

  const dividendRate       = parseFloat(dividendSetting?.value  ?? '5');
  const deductionReturnRate = parseFloat(deductionReturnSetting?.value ?? '10');

  // (g) Savings board — months 1-12, running balance
  let runningBalance = 0;
  const savingsBoard = Array.from({ length: 12 }, (_, i) => {
    const monthIndex = i + 1;
    const contrib = contributions.find((c) => c.month === monthIndex);
    const amountKobo = contrib ? contrib.amountKobo : 0;
    runningBalance += amountKobo;
    return {
      month: monthIndex,
      date: contrib?.paidAt ? contrib.paidAt.toISOString() : null,
      amountKobo,
      balanceKobo: runningBalance,
    };
  });

  // (h) Loan board — per paid installment
  let loanBoard = [];
  for (const loan of loans) {
    let paidSoFar = 0;
    for (const inst of loan.installments) {
      paidSoFar += inst.amountKobo;
      loanBoard.push({
        month: inst.dueDate.getMonth() + 1,
        refundKobo: inst.amountKobo,
        clearedKobo: inst.amountKobo,
        outstandingKobo: Math.max(0, loan.totalRepayableKobo - paidSoFar),
      });
    }
  }

  // (i) Balance sheet
  const totalSavedKobo = contributions.reduce((s, c) => s + c.amountKobo, 0);

  const totalLoanedKobo = loans.reduce((s, l) => {
    const active = ['APPROVED', 'DISBURSED', 'REPAYING', 'COMPLETED'].includes(l.status);
    return active ? s + l.disbursedAmountKobo : s;
  }, 0);

  const totalDeductionsKobo = loans.reduce((s, l) => {
    const active = ['APPROVED', 'DISBURSED', 'REPAYING', 'COMPLETED'].includes(l.status);
    return active ? s + l.feeKobo : s;
  }, 0);

  const deductionReturnKobo  = Math.round(totalDeductionsKobo * deductionReturnRate / 100);
  const dividendAmountKobo   = Math.round(totalSavedKobo * dividendRate / 100);
  const sumTotalKobo         = totalSavedKobo + deductionReturnKobo + dividendAmountKobo;

  // (j) Membership status
  const now = new Date();
  const hasOverdue = loans.some((l) =>
    l.installments.some((inst) => inst.status === 'OVERDUE' || (inst.status === 'PENDING' && new Date(inst.dueDate) < now))
  );

  // Re-query all installments for overdue check (the query above filtered only PAID)
  const allLoansForStatus = await prisma.loan.findMany({
    where: { userId, cycleId: cycle.id, status: { in: ['DISBURSED', 'REPAYING'] } },
    select: {
      installments: {
        where: { status: { in: ['PENDING', 'OVERDUE'] } },
        select: { dueDate: true, status: true },
      },
    },
  });

  const hasOverdueInstallment = allLoansForStatus.some((l) =>
    l.installments.some(
      (inst) =>
        inst.status === 'OVERDUE' ||
        (inst.status === 'PENDING' && new Date(inst.dueDate) < now)
    )
  );

  let membershipStatus;
  let membershipStatusNote;

  if (user.status === 'INACTIVE') {
    membershipStatus     = 'SUSPENDED';
    membershipStatusNote = 'Account is inactive / suspended.';
  } else if (user.status === 'ACTIVE' && hasOverdueInstallment) {
    membershipStatus     = 'CAUTION';
    membershipStatusNote = 'Account is active but has overdue loan installments.';
  } else {
    membershipStatus     = 'GOOD_STANDING';
    membershipStatusNote = 'Account is active with no overdue obligations.';
  }

  // (k) Return full response
  return {
    memberNumber,
    fullName:     user.fullName,
    email:        user.email,
    memberType:   user.memberType,
    issuedDate:   new Date().toISOString(),
    cycle: {
      id:        cycle.id,
      startDate: cycle.startDate.toISOString(),
      endDate:   cycle.endDate.toISOString(),
    },
    savingsBoard,
    loanBoard,
    balanceSheet: {
      totalSavedKobo,
      totalLoanedKobo,
      totalDeductionsKobo,
      deductionReturnKobo,
      dividendRate,
      dividendAmountKobo,
      sumTotalKobo,
    },
    membershipStatus,
    membershipStatusNote,
  };
}

// ---------------------------------------------------------------------------
// getMyClearanceCard — member endpoint
// ---------------------------------------------------------------------------
export async function getMyClearanceCard(req, res, next) {
  try {
    const result = await buildClearanceCard(req.user.id);

    if (result.notFound) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (result.noCycle) {
      return res.status(404).json({ error: 'No active cycle' });
    }

    return res.json(result);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getAdminMemberClearanceCard — admin endpoint
// ---------------------------------------------------------------------------
export async function getAdminMemberClearanceCard(req, res, next) {
  try {
    const { id } = req.params;

    // Verify user exists
    const exists = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await buildClearanceCard(id);

    if (result.notFound) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (result.noCycle) {
      return res.status(404).json({ error: 'No active cycle' });
    }

    return res.json(result);
  } catch (err) {
    next(err);
  }
}
