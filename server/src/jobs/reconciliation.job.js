/**
 * reconciliation.job.js — Hourly idempotent reconciliation with Paystack.
 *
 * Checks all PENDING contributions/installments and APPROVED transfers
 * against Paystack and updates their status if confirmed.
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  verifyTransaction,
  fetchTransfer,
} from '../services/paystack.service.js';
import { appendLedgerEntry } from '../services/ledger.service.js';
import { createNotification } from '../services/notification.service.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

async function reconcile() {
  logger.info('Reconciliation job started');
  let reconciled = 0;

  // (a) Pending contributions
  const pendingContributions = await prisma.contribution.findMany({
    where: { status: 'PENDING', paystackRef: { not: null } },
  });

  for (const contribution of pendingContributions) {
    try {
      const tx = await verifyTransaction(contribution.paystackRef);
      if (tx.status === 'success') {
        await prisma.$transaction(async (txClient) => {
          // Idempotency check
          const current = await txClient.contribution.findUnique({ where: { id: contribution.id } });
          if (current?.status === 'PAID') return;

          await txClient.contribution.update({
            where: { id: contribution.id },
            data: { status: 'PAID', paidAt: new Date() },
          });

          await appendLedgerEntry(txClient, {
            type: 'CONTRIBUTION',
            ledger: 'SAVINGS',
            userId: contribution.userId,
            amountKobo: contribution.amountKobo,
            reference: `reconcile-contribution-${contribution.id}-${uuidv4()}`,
          });
        });
        reconciled++;
      }
    } catch (err) {
      logger.error(`Reconcile contribution ${contribution.id} failed`, err);
    }
  }

  // (b) Pending installments
  const pendingInstallments = await prisma.loanInstallment.findMany({
    where: { status: 'PENDING', paystackRef: { not: null } },
    include: { loan: true },
  });

  for (const installment of pendingInstallments) {
    try {
      const tx = await verifyTransaction(installment.paystackRef);
      if (tx.status === 'success') {
        await prisma.$transaction(async (txClient) => {
          const current = await txClient.loanInstallment.findUnique({ where: { id: installment.id } });
          if (current?.status === 'PAID') return;

          await txClient.loanInstallment.update({
            where: { id: installment.id },
            data: { status: 'PAID', paidAt: new Date() },
          });

          const unpaidCount = await txClient.loanInstallment.count({
            where: { loanId: installment.loanId, status: { not: 'PAID' }, id: { not: installment.id } },
          });

          await txClient.loan.update({
            where: { id: installment.loanId },
            data: { status: unpaidCount === 0 ? 'COMPLETED' : 'REPAYING' },
          });

          await appendLedgerEntry(txClient, {
            type: 'LOAN_REPAYMENT',
            ledger: 'COMPANY_FUND',
            userId: installment.loan.userId,
            loanId: installment.loanId,
            amountKobo: installment.amountKobo,
            reference: `reconcile-repayment-${installment.id}-${uuidv4()}`,
          });
        });
        reconciled++;
      }
    } catch (err) {
      logger.error(`Reconcile installment ${installment.id} failed`, err);
    }
  }

  // (c) Approved loans awaiting disbursement
  const approvedLoans = await prisma.loan.findMany({
    where: { status: 'APPROVED', paystackTransferCode: { not: null } },
  });

  for (const loan of approvedLoans) {
    try {
      const transfer = await fetchTransfer(loan.paystackTransferCode);
      if (transfer.status === 'success') {
        await prisma.$transaction(async (txClient) => {
          const current = await txClient.loan.findUnique({ where: { id: loan.id } });
          if (current?.status === 'DISBURSED') return;

          await txClient.loan.update({ where: { id: loan.id }, data: { status: 'DISBURSED' } });

          await appendLedgerEntry(txClient, {
            type: 'LOAN_DISBURSEMENT',
            ledger: 'COMPANY_FUND',
            userId: loan.userId,
            loanId: loan.id,
            amountKobo: loan.disbursedAmountKobo,
            reference: `reconcile-disbursement-${loan.id}-${uuidv4()}`,
          });
        });
        reconciled++;
      } else if (['failed', 'reversed'].includes(transfer.status)) {
        await prisma.loan.update({ where: { id: loan.id }, data: { status: 'FAILED' } });
      }
    } catch (err) {
      logger.error(`Reconcile loan ${loan.id} failed`, err);
    }
  }

  // (d) Approved refunds awaiting transfer
  const approvedRefunds = await prisma.refund.findMany({
    where: { status: 'APPROVED', paystackTransferCode: { not: null } },
  });

  for (const refund of approvedRefunds) {
    try {
      const transfer = await fetchTransfer(refund.paystackTransferCode);
      if (transfer.status === 'success') {
        await prisma.$transaction(async (txClient) => {
          const current = await txClient.refund.findUnique({ where: { id: refund.id } });
          if (current?.status === 'TRANSFERRED') return;

          await txClient.refund.update({ where: { id: refund.id }, data: { status: 'TRANSFERRED' } });

          await appendLedgerEntry(txClient, {
            type: 'REFUND',
            ledger: 'COMPANY_FUND',
            userId: refund.userId,
            amountKobo: refund.amountKobo,
            reference: `reconcile-refund-${refund.id}-${uuidv4()}`,
          });
        });
        reconciled++;
      } else if (['failed', 'reversed'].includes(transfer.status)) {
        await prisma.refund.update({ where: { id: refund.id }, data: { status: 'FAILED' } });
      }
    } catch (err) {
      logger.error(`Reconcile refund ${refund.id} failed`, err);
    }
  }

  logger.info(`Reconciliation complete. ${reconciled} records updated.`);
}

export function startReconciliationJob() {
  // Run immediately on startup
  reconcile().catch((err) => logger.error('Startup reconciliation failed', err));

  // Run every hour
  cron.schedule('0 * * * *', async () => {
    await reconcile().catch((err) => logger.error('Scheduled reconciliation failed', err));
  });

  logger.info('Reconciliation job scheduled (hourly)');
}
