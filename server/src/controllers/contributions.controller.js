/**
 * contributions.controller.js — Member contribution endpoints.
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { initializeTransaction } from '../services/paystack.service.js';
import { getContributionPeriod } from '../utils/cycleHelpers.js';
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
        paidAt: true,
        paystackRef: true,
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

    return res.json({
      month,
      year,
      status: contribution?.status ?? 'NOT_PAID',
      contribution: contribution ?? null,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// initializePayment
// ---------------------------------------------------------------------------
export async function initializePayment(req, res, next) {
  try {
    const cycle = await findActiveCycle();
    if (!cycle) {
      return res.status(404).json({ error: 'No active cycle found' });
    }

    const { month, year } = getContributionPeriod();
    const amountKobo = await getMonthlyAmountKobo();

    // Check if already paid this month
    const existing = await prisma.contribution.findUnique({
      where: {
        userId_cycleId_month_year: {
          userId: req.user.id,
          cycleId: cycle.id,
          month,
          year,
        },
      },
    });

    if (existing?.status === 'PAID') {
      return res.status(400).json({ error: 'Contribution for this month has already been paid' });
    }

    const reference = uuidv4();

    // Create or update the pending contribution record
    if (existing) {
      await prisma.contribution.update({
        where: { id: existing.id },
        data: { paystackRef: reference },
      });
    } else {
      await prisma.contribution.create({
        data: {
          userId: req.user.id,
          cycleId: cycle.id,
          month,
          year,
          amountKobo,
          status: 'PENDING',
          paystackRef: reference,
        },
      });
    }

    const paystackData = await initializeTransaction({
      email: req.user.email,
      amountKobo,
      reference,
      metadata: {
        userId: req.user.id,
        cycleId: cycle.id,
        month,
        year,
        type: 'CONTRIBUTION',
      },
    });

    return res.json({ authorization_url: paystackData.authorization_url, reference });
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
