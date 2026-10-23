/**
 * ledger.service.js — Append-only ledger management.
 *
 * Business rules for ledger books:
 *  SAVINGS ledger:
 *    CONTRIBUTION → credit  (member pays in, savings grows)
 *
 *  COMPANY_FUND ledger:
 *    LOAN_DISBURSEMENT → debit  (money leaves the fund to the member)
 *    REFUND            → debit  (money leaves the fund back to the member)
 *    LOAN_REPAYMENT    → credit (member pays back, fund grows)
 *    LOAN_FEE          → credit (fee stays in fund)
 *    FUND_TOPUP        → credit (admin tops up the fund)
 *
 * All ledger entries are append-only — never updated or deleted.
 * Every call to appendLedgerEntry MUST occur inside a Prisma $transaction.
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';

const globalPrisma = new PrismaClient();

// Ledger types that are DEBITS (reduce the balance)
const DEBIT_TYPES = new Set(['LOAN_DISBURSEMENT', 'REFUND']);

/**
 * Retrieve the current running balance for a given ledger book.
 * Returns 0 if no entries exist yet.
 *
 * @param {LedgerBook} ledger - 'SAVINGS' | 'COMPANY_FUND'
 * @returns {Promise<number>} Current balance in kobo
 */
export async function getCurrentBalance(ledger) {
  const latest = await globalPrisma.ledgerEntry.findFirst({
    where: { ledger },
    orderBy: { createdAt: 'desc' },
    select: { balanceAfterKobo: true },
  });
  return latest?.balanceAfterKobo ?? 0;
}

/**
 * Generate a unique reference for ledger entries using UUID
 * @param {string} type - Ledger type
 * @param {string} id - Resource ID
 * @returns {string} Unique reference
 */
export function generateLedgerReference(type, id) {
  return `${type.toLowerCase()}-${id}-${uuid()}`;
}

/**
 * Append a new ledger entry inside a Prisma transaction.
 * Calculates the new running balance and persists the entry.
 *
 * @param {import('@prisma/client').PrismaClient} prismaClient - Transaction client from $transaction
 * @param {{
 *   type: string,
 *   ledger: string,
 *   userId?: string,
 *   loanId?: string,
 *   amountKobo: number,
 *   reference: string
 * }} params
 * @returns {Promise<import('@prisma/client').LedgerEntry>}
 */
export async function appendLedgerEntry(prismaClient, { type, ledger, userId, loanId, amountKobo, reference }) {
  try {
    // Get the latest balance within the same transaction to avoid races
    const latest = await prismaClient.ledgerEntry.findFirst({
      where: { ledger },
      orderBy: { createdAt: 'desc' },
      select: { balanceAfterKobo: true },
    });

    const currentBalance = latest?.balanceAfterKobo ?? 0;
    const isDebit = DEBIT_TYPES.has(type);
    const newBalance = isDebit ? currentBalance - amountKobo : currentBalance + amountKobo;

    return await prismaClient.ledgerEntry.create({
      data: {
        type,
        ledger,
        userId: userId ?? null,
        loanId: loanId ?? null,
        amountKobo,
        balanceAfterKobo: newBalance,
        reference,
      },
    });
  } catch (error) {
    console.error('Ledger entry creation failed:', {
      type,
      ledger,
      userId,
      loanId,
      amountKobo,
      reference,
      error: error.message,
    });
    throw error; // Re-throw to trigger transaction rollback
  }
}
