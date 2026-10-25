/**
 * contributions.controller.js — Member contribution endpoints.
 * Manual bank-transfer flow (Paystack removed).
 */

import { PrismaClient } from '@prisma/client';
import { getContributionPeriod } from '../utils/cycleHelpers.js';
import { createNotification } from '../services/notification.service.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/** Retrieve the monthly contribution amount from settings (default ₦5,000 = 500,000 kobo) */
async function getMonthlyAmountKobo() {
  const setting = await prisma.setting.findUnique({ where: { key: 'monthly_amount' } });
  return setting ? parseInt(setting.value, 10) : 500000;
}

/** Retrieve the active cycle or return null */
async function findActiveCycle() {
  return prisma.cycle.findFirst({ where: { isActive: true } });
}

// ---------------------------------------------------------------------------
// getMyContributions
// ---------------------------------------------------------------------------
export async function getMyContributions(req, res, next) {
  try {
    const cycle = await findActiveCycle();
    if (!cycle) {
      return res.status(404).json({ error: 'No active cycle found' });
    }

    const contributions = await prisma.contribution.findMany({
      where: { userId: req.user.id, cycleId: cycle.id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      select: {
        id: true,
        month: true,
        year: true,
        status: true,
        amountKobo: true,
        amountSubmittedKobo: true,
        paymentNote: true,
        rejectionReason: true,
        submittedAt: true,
        paidAt: true,
        createdAt: true,
      },
    });

    return res.json({ contributions, cycle });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getContributionStatus
// ---------------------------------------------------------------------------
export async function getContributionStatus(req, res, next) {
  try {
    const cycle = await findActiveCycle();
    if (!cycle) {
      return res.status(404).json({ error: 'No active cycle found' });
    }

    const { month, year } = getContributionPeriod();

    // Get all contributions for this month (can be multiple)
    const contributions = await prisma.contribution.findMany({
      where: {
        userId: req.user.id,
        cycleId: cycle.id,
        month,
        year,
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Calculate total paid this month
    const totalPaidKobo = contributions
      .filter((c) => c.status === 'PAID')
      .reduce((sum, c) => sum + c.amountKobo, 0);

    const hasPending = contributions.some((c) => c.status === 'PENDING_CONFIRMATION');

    return res.json({
      month,
      year,
      status: totalPaidKobo > 0 ? 'PAID' : hasPending ? 'PENDING_CONFIRMATION' : 'NOT_PAID',
      contributions,
      totalPaidKobo,
      contributionCount: contributions.length,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getBankDetails — returns the cooperative's bank account details
// ---------------------------------------------------------------------------
export async function getBankDetails(req, res, next) {
  try {
    const keys = ['coop_bank_name', 'coop_account_number', 'coop_account_name'];
    const settings = await prisma.setting.findMany({ where: { key: { in: keys } } });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return res.json({
      bankName: map.coop_bank_name || '',
      accountNumber: map.coop_account_number || '',
      accountName: map.coop_account_name || '',
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// submitPayment — member declares they have made a transfer
// ---------------------------------------------------------------------------
export async function submitPayment(req, res, next) {
  try {
    const cycle = await findActiveCycle();
    if (!cycle) {
      return res.status(404).json({ error: 'No active cycle found' });
    }

    const currentPeriod = getContributionPeriod();
    const month = req.body.month || currentPeriod.month;
    const year = req.body.year || currentPeriod.year;
    const { amountKobo, paymentNote } = req.body;

    if (!amountKobo || typeof amountKobo !== 'number' || amountKobo <= 0) {
      return res.status(422).json({ error: 'amountKobo must be a positive number' });
    }

    const minAmount = await getMonthlyAmountKobo();
    if (amountKobo < minAmount) {
      return res.status(422).json({
        error: `Amount must be at least ₦${(minAmount / 100).toLocaleString('en-NG')}`,
      });
    }

    const now = new Date();

    // Create new contribution (allow multiple per month)
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

    // Notify all admins
    const monthName = new Date(year, month - 1).toLocaleString('en-NG', { month: 'long' });
    const amountNaira = (amountKobo / 100).toLocaleString('en-NG');
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' } });

    await Promise.all(
      admins.map((admin) =>
        createNotification(prisma, {
          userId: admin.id,
          title: 'New Contribution Payment Submitted',
          message: `${req.user.fullName} has submitted a contribution payment of ₦${amountNaira} for ${monthName} ${year}`,
          type: 'CONTRIBUTION_SUBMITTED',
        }).catch((err) => logger.error('createNotification admin failed', err))
      )
    );

    return res.json({ message: 'Payment submitted, awaiting admin confirmation' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getConsistentStreak
// ---------------------------------------------------------------------------
export async function getConsistentStreak(req, res, next) {
  try {
    const cycle = await findActiveCycle();
    if (!cycle) {
      return res.json({ streak: 0 });
    }

    const now = new Date();
    let month = now.getMonth() + 1;
    let year = now.getFullYear();
    let streak = 0;

    for (let i = 0; i < 24; i++) {
      // eslint-disable-next-line no-await-in-loop
      const contribution = await prisma.contribution.findUnique({
        where: {
          userId_cycleId_month_year: {
            userId: req.user.id,
            cycleId: cycle.id,
            month,
            year,
          },
        },
      });

      if (!contribution || contribution.status !== 'PAID') break;

      streak += 1;
      month -= 1;
      if (month === 0) {
        month = 12;
        year -= 1;
      }
    }

    return res.json({ streak });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getMonthlyAmount
// ---------------------------------------------------------------------------
export async function getMonthlyAmount(req, res, next) {
  try {
    const amountKobo = await getMonthlyAmountKobo();
    return res.json({ amountKobo });
  } catch (err) {
    next(err);
  }
}
