/**
 * member.controller.js — Member-specific endpoints
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * getMyTransactions — Get authenticated member's transaction history
 */
export async function getMyTransactions(req, res, next) {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    // Optional filters
    const { type, startDate, endDate, format } = req.query;
    
    const where = {
      userId,
      ...(type && { type }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    // CSV export
    if (format === 'csv') {
      const entries = await prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          ledger: true,
          amountKobo: true,
          balanceAfterKobo: true,
          reference: true,
          createdAt: true,
        },
      });

      const headers = 'Date,Type,Ledger,Amount (₦),Balance After (₦),Reference\n';
      const rows = entries.map((e) => {
        return [
          e.createdAt.toISOString().split('T')[0],
          e.type,
          e.ledger,
          (e.amountKobo / 100).toFixed(2),
          (e.balanceAfterKobo / 100).toFixed(2),
          e.reference || '',
        ].join(',');
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="my-transactions.csv"');
      return res.send(headers + rows.join('\n'));
    }

    const [entries, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          ledger: true,
          amountKobo: true,
          balanceAfterKobo: true,
          reference: true,
          createdAt: true,
        },
      }),
      prisma.ledgerEntry.count({ where }),
    ]);

    return res.json({
      transactions: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error('getMyTransactions error', err);
    next(err);
  }
}

/**
 * getMyFinancialSummary — Get member's financial overview
 */
export async function getMyFinancialSummary(req, res, next) {
  try {
    const userId = req.user.id;

    // Get total savings from ledger
    const savingsBalance = await prisma.ledgerEntry.findFirst({
      where: { userId, ledger: 'SAVINGS' },
      orderBy: { createdAt: 'desc' },
      select: { balanceAfterKobo: true },
    });

    // Get loan summary
    const loans = await prisma.loan.findMany({
      where: {
        userId,
        status: { in: ['DISBURSED', 'REPAYING', 'COMPLETED'] },
      },
      include: {
        installments: {
          select: { amountKobo: true, status: true },
        },
      },
    });

    let totalLoanCollectedKobo = 0;
    let totalLoanRepaidKobo = 0;
    let outstandingLoanKobo = 0;

    for (const loan of loans) {
      totalLoanCollectedKobo += loan.disbursedAmountKobo;
      const repaid = loan.installments
        .filter((i) => i.status === 'PAID')
        .reduce((sum, i) => sum + i.amountKobo, 0);
      totalLoanRepaidKobo += repaid;

      if (['DISBURSED', 'REPAYING'].includes(loan.status)) {
        outstandingLoanKobo += Math.max(0, loan.totalRepayableKobo - repaid);
      }
    }

    return res.json({
      totalSavingsKobo: savingsBalance?.balanceAfterKobo || 0,
      totalLoanCollectedKobo,
      totalLoanRepaidKobo,
      outstandingLoanKobo,
    });
  } catch (err) {
    logger.error('getMyFinancialSummary error', err);
    next(err);
  }
}
