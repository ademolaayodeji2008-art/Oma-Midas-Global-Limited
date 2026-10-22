/**
 * loans.controller.js — Member loan request and repayment endpoints.
 */

import { PrismaClient } from '@prisma/client';
import { calculateLoanBreakdown } from '../utils/kobo.js';
import { createNotification } from '../services/notification.service.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/** Get setting value as integer */
async function getSettingInt(key, defaultValue) {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting ? parseInt(setting.value, 10) : defaultValue;
}

/** Find the active cycle */
async function findActiveCycle() {
  return prisma.cycle.findFirst({ where: { isActive: true } });
}

/** Get total PAID contributions for a user in a cycle */
async function getUserSavingsInCycle(userId, cycleId) {
  const result = await prisma.contribution.aggregate({
    where: { userId, cycleId, status: 'PAID' },
    _sum: { amountKobo: true },
  });
  return result._sum.amountKobo ?? 0;
}

/** Count consecutive paid months from most recent going backwards */
async function countConsecutivePaidMonths(userId, cycleId) {
  const now = new Date();
  let month = now.getMonth() + 1;
  let year = now.getFullYear();
  let count = 0;

  for (let i = 0; i < 24; i++) {
    // eslint-disable-next-line no-await-in-loop
    const contribution = await prisma.contribution.findUnique({
      where: { userId_cycleId_month_year: { userId, cycleId, month, year } },
    });

    if (!contribution || contribution.status !== 'PAID') break;
    count += 1;
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// checkEligibility
// ---------------------------------------------------------------------------
export async function checkEligibility(req, res, next) {
  try {
    const userId = req.user.id;
    const reasons = [];

    // 1. User must be ACTIVE
    if (req.user.status !== 'ACTIVE') {
      reasons.push('Your account must be active to apply for a loan');
    }

    // 2. No existing active loan
    const activeLoan = await prisma.loan.findFirst({
      where: {
        userId,
        status: { notIn: ['REJECTED', 'COMPLETED'] },
      },
    });
    if (activeLoan) {
      reasons.push('You already have an active loan');
    }

    const cycle = await findActiveCycle();
    if (!cycle) {
      return res.status(404).json({ error: 'No active cycle found' });
    }

    const minMonths = await getSettingInt('min_consecutive_months', 3);
    const loanMultiplier = await getSettingInt('loan_multiplier', 2);
    const feePercentage = await getSettingInt('fee_percentage', 10);
    const consecutiveMonths = await countConsecutivePaidMonths(userId, cycle.id);
    const isExistingMember = req.user.memberType === 'EXISTING';

    if (!isExistingMember && consecutiveMonths < minMonths) {
      reasons.push(
        `You need at least ${minMonths} consecutive paid months (you have ${consecutiveMonths})`
      );
    }

    // 4. Company fund check
    const { getCurrentBalance } = await import('../services/ledger.service.js');
    const companyFundBalance = await getCurrentBalance('COMPANY_FUND');

    // 5. Calculate max loan amount
    const userSavings = await getUserSavingsInCycle(userId, cycle.id);
    const maxLoanKobo = userSavings * loanMultiplier;

    const eligible = reasons.length === 0;

    return res.json({
      eligible,
      reasons,
      meta: {
        consecutiveMonths,
        minMonths,
        userSavingsKobo: userSavings,
        maxLoanKobo,
        companyFundBalanceKobo: companyFundBalance,
        feePercentage,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// requestLoan
// ---------------------------------------------------------------------------
export async function requestLoan(req, res, next) {
  try {
    // Loan request deadline: must be submitted before the 25th of each month
    const today = new Date();
    if (today.getDate() > 25) {
      return res.status(400).json({
        message: 'Loan requests must be submitted before the 25th of each month. Please try again next month.',
      });
    }

    const { requestedAmountKobo, repaymentMonths, installmentSchedule } = req.body;
    const userId = req.user.id;

    // Loan requests must be submitted before the 25th of each month
    const todayDay = new Date().getDate();
    if (todayDay >= 25) {
      return res.status(400).json({
        error: 'Loan requests must be submitted before the 25th of each month. Please try again next month.',
      });
    }

    if (!requestedAmountKobo || !repaymentMonths || !installmentSchedule) {
      return res.status(422).json({ error: 'requestedAmountKobo, repaymentMonths, and installmentSchedule are required' });
    }

    const cycle = await findActiveCycle();
    if (!cycle) {
      return res.status(404).json({ error: 'No active cycle found' });
    }

    // Re-run eligibility
    const activeLoan = await prisma.loan.findFirst({
      where: { userId, status: { notIn: ['REJECTED', 'COMPLETED'] } },
    });
    if (activeLoan) {
      return res.status(400).json({ error: 'You already have an active loan' });
    }

    if (req.user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account must be active to request a loan' });
    }

    const loanMultiplier = await getSettingInt('loan_multiplier', 2);
    const feePercentage = await getSettingInt('fee_percentage', 10);
    const breakdown = calculateLoanBreakdown(requestedAmountKobo, feePercentage);

    // Validate installment schedule sums to totalRepayableKobo
    const scheduleTotal = installmentSchedule.reduce((sum, i) => sum + i.amountKobo, 0);
    if (scheduleTotal !== breakdown.totalRepayableKobo) {
      return res.status(422).json({
        error: `Installment schedule total (${scheduleTotal}) does not match totalRepayableKobo (${breakdown.totalRepayableKobo})`,
      });
    }

    if (installmentSchedule.length !== repaymentMonths) {
      return res.status(422).json({ error: 'repaymentMonths does not match installmentSchedule length' });
    }

    // All dates must be on or before cycle end (Sep 30)
    const cycleEnd = new Date(cycle.endDate);
    for (const inst of installmentSchedule) {
      if (new Date(inst.dueDate) > cycleEnd) {
        return res.status(422).json({ error: `Installment date ${inst.dueDate} is after cycle end date` });
      }
    }

    // Max loan = 2× savings
    const userSavings = await getUserSavingsInCycle(userId, cycle.id);
    const maxLoanKobo = userSavings * loanMultiplier;
    if (requestedAmountKobo > maxLoanKobo) {
      return res.status(400).json({
        error: `Requested amount exceeds maximum loan of ₦${(maxLoanKobo / 100).toFixed(2)} (${loanMultiplier}× savings)`,
      });
    }

    // Create loan + installments in a transaction
    const loan = await prisma.$transaction(async (tx) => {
      const newLoan = await tx.loan.create({
        data: {
          userId,
          cycleId: cycle.id,
          requestedAmountKobo: breakdown.requestedAmountKobo,
          feeKobo: breakdown.feeKobo,
          disbursedAmountKobo: breakdown.disbursedAmountKobo,
          totalRepayableKobo: breakdown.totalRepayableKobo,
          repaymentMonths,
          status: 'PENDING',
          installments: {
            create: installmentSchedule.map((inst) => ({
              dueDate: new Date(inst.dueDate),
              amountKobo: inst.amountKobo,
              status: 'PENDING',
            })),
          },
        },
        include: { installments: true },
      });
      return newLoan;
    });

    return res.status(201).json({ loan });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getMyLoans
// ---------------------------------------------------------------------------
export async function getMyLoans(req, res, next) {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId: req.user.id },
      include: { installments: { orderBy: { dueDate: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ loans });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getMyCurrentLoan
// ---------------------------------------------------------------------------
export async function getMyCurrentLoan(req, res, next) {
  try {
    const loan = await prisma.loan.findFirst({
      where: {
        userId: req.user.id,
        status: { notIn: ['REJECTED', 'COMPLETED'] },
      },
      include: { installments: { orderBy: { dueDate: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ loan: loan ?? null });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// submitInstallmentPayment — member submits manual bank transfer for an installment
// ---------------------------------------------------------------------------
export async function submitInstallmentPayment(req, res, next) {
  try {
    const { installmentId } = req.body;

    if (!installmentId) {
      return res.status(422).json({ error: 'installmentId is required' });
    }

    // Find installment belonging to user's loan
    const installment = await prisma.loanInstallment.findFirst({
      where: {
        id: installmentId,
        loan: { userId: req.user.id },
      },
      include: { loan: true },
    });

    if (!installment) {
      return res.status(404).json({ error: 'Installment not found' });
    }

    if (installment.status === 'PAID') {
      return res.status(400).json({ error: 'Already paid' });
    }

    if (installment.status === 'PENDING_CONFIRMATION') {
      return res.status(400).json({ error: 'Already submitted, awaiting admin confirmation' });
    }

    // Update installment status
    await prisma.loanInstallment.update({
      where: { id: installmentId },
      data: { status: 'PENDING_CONFIRMATION', submittedAt: new Date() },
    });

    // Notify all admin users
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    const amountFormatted = (installment.amountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const dueDateFormatted = new Date(installment.dueDate).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    await Promise.all(
      admins.map((admin) =>
        createNotification(prisma, {
          userId: admin.id,
          title: 'Repayment Submitted',
          message: `${req.user.fullName} has submitted repayment of ₦${amountFormatted} for installment due ${dueDateFormatted}`,
          type: 'REPAYMENT_SUBMITTED',
        }).catch((err) => logger.error('createNotification failed', err))
      )
    );

    return res.json({ message: 'Payment submitted, awaiting admin confirmation' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getMyLoanSummary — member's own loan summary
// ---------------------------------------------------------------------------
export async function getMyLoanSummary(req, res, next) {
  try {
    const userId = req.user.id;

    const loans = await prisma.loan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        cycle: { select: { startDate: true, endDate: true } },
        installments: { select: { amountKobo: true, status: true, dueDate: true } },
      },
    });

    let totalCollectedKobo = 0;
    let totalRepaidKobo = 0;
    let outstandingKobo = 0;
    let activeLoanStatus = null;

    const loanRows = loans.map((loan) => {
      const repaidOnLoan = loan.installments
        .filter((i) => i.status === 'PAID')
        .reduce((s, i) => s + i.amountKobo, 0);

      if (['DISBURSED', 'REPAYING', 'COMPLETED'].includes(loan.status)) {
        totalCollectedKobo += loan.disbursedAmountKobo;
      }
      totalRepaidKobo += repaidOnLoan;

      if (['DISBURSED', 'REPAYING'].includes(loan.status)) {
        const remaining = Math.max(0, loan.totalRepayableKobo - repaidOnLoan);
        outstandingKobo += remaining;
        activeLoanStatus = loan.status;
      }

      return {
        id: loan.id,
        status: loan.status,
        requestedAmountKobo: loan.requestedAmountKobo,
        disbursedAmountKobo: loan.disbursedAmountKobo,
        totalRepayableKobo: loan.totalRepayableKobo,
        repaidKobo: repaidOnLoan,
        outstandingKobo: ['DISBURSED', 'REPAYING'].includes(loan.status)
          ? Math.max(0, loan.totalRepayableKobo - repaidOnLoan)
          : 0,
        cycleStart: loan.cycle?.startDate,
        cycleEnd: loan.cycle?.endDate,
        createdAt: loan.createdAt,
      };
    });

    return res.json({
      loans: loanRows,
      summary: {
        totalCollectedKobo,
        totalRepaidKobo,
        outstandingKobo,
        activeLoanStatus,
      },
    });
  } catch (err) {
    next(err);
  }
}
