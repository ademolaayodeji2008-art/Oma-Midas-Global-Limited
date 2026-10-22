/**
 * refunds.controller.js — Member refund request endpoints.
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// requestRefund
// ---------------------------------------------------------------------------
export async function requestRefund(req, res, next) {
  try {
    const userId = req.user.id;

    // Block if the user has any outstanding (DISBURSED or REPAYING) loan
    const outstandingLoan = await prisma.loan.findFirst({
      where: { userId, status: { in: ['DISBURSED', 'REPAYING'] } },
    });

    if (outstandingLoan) {
      return res.status(400).json({
        error: 'You cannot request a refund while you have an outstanding loan',
      });
    }

    // Find active cycle
    const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
    if (!cycle) {
      return res.status(404).json({ error: 'No active cycle found' });
    }

    // Calculate total savings in this cycle
    const savingsResult = await prisma.contribution.aggregate({
      where: { userId, cycleId: cycle.id, status: 'PAID' },
      _sum: { amountKobo: true },
    });

    const totalSavingsKobo = savingsResult._sum.amountKobo ?? 0;

    if (totalSavingsKobo === 0) {
      return res.status(400).json({ error: 'You have no paid contributions to refund in this cycle' });
    }

    // Check no existing pending refund
    const existingRefund = await prisma.refund.findFirst({
      where: { userId, cycleId: cycle.id, status: 'PENDING' },
    });

    if (existingRefund) {
      return res.status(400).json({ error: 'You already have a pending refund request' });
    }

    const refund = await prisma.refund.create({
      data: {
        userId,
        cycleId: cycle.id,
        amountKobo: totalSavingsKobo,
        status: 'PENDING',
      },
    });

    return res.status(201).json({ refund });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getMyRefunds
// ---------------------------------------------------------------------------
export async function getMyRefunds(req, res, next) {
  try {
    const [refunds, activeLoan] = await Promise.all([
      prisma.refund.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        include: { cycle: true },
      }),
      prisma.loan.findFirst({
        where: { userId: req.user.id, status: { in: ['DISBURSED', 'REPAYING'] } },
        select: { id: true },
      }),
    ]);
    return res.json({ refunds, hasActiveLoan: !!activeLoan });
  } catch (err) {
    next(err);
  }
}
