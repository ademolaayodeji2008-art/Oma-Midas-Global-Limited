/**
 * paystack.controller.js — Paystack webhook handler and utility endpoints.
 *
 * Webhook verification: HMAC-SHA512 of raw request body using PAYSTACK_SECRET_KEY.
 * Raw body is set on req.rawBody by the verify callback in server.js.
 */

import { createHmac } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  resolveAccountNumber,
  listBanks as paystackListBanks,
} from '../services/paystack.service.js';
import { appendLedgerEntry } from '../services/ledger.service.js';
import { createNotification } from '../services/notification.service.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// webhook
// ---------------------------------------------------------------------------
export async function webhook(req, res, next) {
  try {
    // Verify HMAC-SHA512 signature
    const signature = req.headers['x-paystack-signature'];
    const rawBody = req.rawBody;

    if (!rawBody || !signature) {
      return res.status(401).json({ error: 'Missing signature or body' });
    }

    const expected = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    if (signature !== expected) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Acknowledge immediately
    res.status(200).json({ received: true });

    // Process event asynchronously
    const event = req.body;
    const { event: eventType, data } = event;

    try {
      await handleWebhookEvent(eventType, data);
    } catch (err) {
      logger.error(`Webhook event processing failed: ${eventType}`, err);
    }
  } catch (err) {
    next(err);
  }
}

async function handleWebhookEvent(eventType, data) {
  switch (eventType) {
    case 'charge.success':
      await handleChargeSuccess(data);
      break;
    case 'transfer.success':
      await handleTransferSuccess(data);
      break;
    case 'transfer.failed':
    case 'transfer.reversed':
      await handleTransferFailed(data);
      break;
    default:
      logger.info(`Unhandled webhook event: ${eventType}`);
  }
}

// ---------------------------------------------------------------------------
// charge.success handler
// ---------------------------------------------------------------------------
async function handleChargeSuccess(data) {
  const reference = data.reference;
  const metadata = data.metadata || {};

  if (metadata.type === 'CONTRIBUTION') {
    // Find contribution by paystackRef
    const contribution = await prisma.contribution.findUnique({
      where: { paystackRef: reference },
    });

    if (!contribution || contribution.status === 'PAID') return; // idempotent

    await prisma.$transaction(async (tx) => {
      await tx.contribution.update({
        where: { id: contribution.id },
        data: { status: 'PAID', paidAt: new Date() },
      });

      await appendLedgerEntry(tx, {
        type: 'CONTRIBUTION',
        ledger: 'SAVINGS',
        userId: contribution.userId,
        amountKobo: contribution.amountKobo,
        reference: `contribution-${contribution.id}-${uuidv4()}`,
      });

      await createNotification(tx, {
        userId: contribution.userId,
        title: 'Contribution Received',
        message: `Your contribution of ₦${(contribution.amountKobo / 100).toFixed(2)} has been received.`,
        type: 'CONTRIBUTION_PAID',
      });
    });

    logger.info(`Contribution ${contribution.id} marked as PAID`);
  } else if (metadata.type === 'LOAN_REPAYMENT') {
    // Find installment
    const installment = await prisma.loanInstallment.findUnique({
      where: { paystackRef: reference },
      include: { loan: true },
    });

    if (!installment || installment.status === 'PAID') return; // idempotent

    await prisma.$transaction(async (tx) => {
      await tx.loanInstallment.update({
        where: { id: installment.id },
        data: { status: 'PAID', paidAt: new Date() },
      });

      // Check if all installments are now paid
      const unpaidCount = await tx.loanInstallment.count({
        where: { loanId: installment.loanId, status: { not: 'PAID' }, id: { not: installment.id } },
      });

      const newLoanStatus = unpaidCount === 0 ? 'COMPLETED' : 'REPAYING';
      await tx.loan.update({
        where: { id: installment.loanId },
        data: { status: newLoanStatus },
      });

      await appendLedgerEntry(tx, {
        type: 'LOAN_REPAYMENT',
        ledger: 'COMPANY_FUND',
        userId: installment.loan.userId,
        loanId: installment.loanId,
        amountKobo: installment.amountKobo,
        reference: `repayment-${installment.id}-${uuidv4()}`,
      });

      await createNotification(tx, {
        userId: installment.loan.userId,
        title: 'Loan Repayment Received',
        message: `Your loan repayment of ₦${(installment.amountKobo / 100).toFixed(2)} has been received.`,
        type: 'LOAN_REPAYMENT',
      });
    });

    logger.info(`Installment ${installment.id} marked as PAID`);
  }
}

// ---------------------------------------------------------------------------
// transfer.success handler
// ---------------------------------------------------------------------------
async function handleTransferSuccess(data) {
  const transferCode = data.transfer_code;

  // Check if this is a loan disbursement
  const loan = await prisma.loan.findFirst({
    where: { paystackTransferCode: transferCode },
  });

  if (loan) {
    if (loan.status === 'DISBURSED') return; // idempotent

    await prisma.$transaction(async (tx) => {
      await tx.loan.update({
        where: { id: loan.id },
        data: { status: 'DISBURSED' },
      });

      await appendLedgerEntry(tx, {
        type: 'LOAN_DISBURSEMENT',
        ledger: 'COMPANY_FUND',
        userId: loan.userId,
        loanId: loan.id,
        amountKobo: loan.disbursedAmountKobo,
        reference: `disbursement-${loan.id}-${uuidv4()}`,
      });

      // LOAN_FEE stays in the fund (credit back, fee already deducted from disbursedAmount)
      await appendLedgerEntry(tx, {
        type: 'LOAN_FEE',
        ledger: 'COMPANY_FUND',
        userId: loan.userId,
        loanId: loan.id,
        amountKobo: loan.feeKobo,
        reference: `fee-${loan.id}-${uuidv4()}`,
      });

      await createNotification(tx, {
        userId: loan.userId,
        title: 'Loan Disbursed',
        message: `Your loan of ₦${(loan.disbursedAmountKobo / 100).toFixed(2)} has been disbursed to your bank account.`,
        type: 'LOAN_DISBURSED',
      });
    });

    logger.info(`Loan ${loan.id} disbursement confirmed`);
    return;
  }

  // Check if this is a refund transfer
  const refund = await prisma.refund.findFirst({
    where: { paystackTransferCode: transferCode },
  });

  if (refund) {
    if (refund.status === 'TRANSFERRED') return; // idempotent

    await prisma.$transaction(async (tx) => {
      await tx.refund.update({
        where: { id: refund.id },
        data: { status: 'TRANSFERRED' },
      });

      await appendLedgerEntry(tx, {
        type: 'REFUND',
        ledger: 'COMPANY_FUND',
        userId: refund.userId,
        amountKobo: refund.amountKobo,
        reference: `refund-${refund.id}-${uuidv4()}`,
      });

      await createNotification(tx, {
        userId: refund.userId,
        title: 'Refund Transferred',
        message: `Your refund of ₦${(refund.amountKobo / 100).toFixed(2)} has been transferred to your bank account.`,
        type: 'REFUND_TRANSFERRED',
      });
    });

    logger.info(`Refund ${refund.id} transferred successfully`);
  }
}

// ---------------------------------------------------------------------------
// transfer.failed / transfer.reversed handler
// ---------------------------------------------------------------------------
async function handleTransferFailed(data) {
  const transferCode = data.transfer_code;

  const loan = await prisma.loan.findFirst({
    where: { paystackTransferCode: transferCode },
  });

  if (loan) {
    await prisma.loan.update({
      where: { id: loan.id },
      data: { status: 'FAILED' },
    });

    await createNotification(prisma, {
      userId: loan.userId,
      title: 'Loan Disbursement Failed',
      message: 'Your loan disbursement transfer has failed. Please contact the administrator.',
      type: 'LOAN_FAILED',
    });

    logger.warn(`Loan ${loan.id} disbursement failed/reversed`);
    return;
  }

  const refund = await prisma.refund.findFirst({
    where: { paystackTransferCode: transferCode },
  });

  if (refund) {
    await prisma.refund.update({
      where: { id: refund.id },
      data: { status: 'FAILED' },
    });

    await createNotification(prisma, {
      userId: refund.userId,
      title: 'Refund Transfer Failed',
      message: 'Your refund transfer has failed. Please contact the administrator.',
      type: 'REFUND_FAILED',
    });

    logger.warn(`Refund ${refund.id} transfer failed/reversed`);
  }
}

// ---------------------------------------------------------------------------
// resolveAccount
// ---------------------------------------------------------------------------
export async function resolveAccount(req, res, next) {
  try {
    const { accountNumber, bankCode } = req.query;

    if (!accountNumber || !bankCode) {
      return res.status(422).json({ error: 'accountNumber and bankCode are required' });
    }

    const result = await resolveAccountNumber({ accountNumber, bankCode });
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// listBanks
// ---------------------------------------------------------------------------
export async function listBanks(req, res, next) {
  try {
    const banks = await paystackListBanks();
    return res.json({ banks });
  } catch (err) {
    next(err);
  }
}
