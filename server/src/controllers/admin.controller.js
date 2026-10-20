/**
 * admin.controller.js — Administrative endpoints.
 * All routes require authenticate + adminOnly middleware.
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  getBalance as paystackGetBalance,
  createTransferRecipient,
  initiateTransfer,
} from '../services/paystack.service.js';
import { appendLedgerEntry, getCurrentBalance } from '../services/ledger.service.js';
import {
  sendApprovalEmail,
  sendRejectionEmail,
  sendLoanApprovalEmail,
  sendLoanRejectionEmail,
  sendRefundApprovalEmail,
  sendContributionConfirmedEmail,
  sendContributionRejectedEmail,
} from '../services/email.service.js';
import { createNotification } from '../services/notification.service.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Audit log helper
// ---------------------------------------------------------------------------
async function logAudit(adminId, action, targetType, targetId = null, metadata = null) {
  try {
    await prisma.auditLog.create({
      data: { adminId, action, targetType, targetId, metadata },
    });
  } catch (err) {
    logger.error('Failed to create audit log', err);
  }
}

// ---------------------------------------------------------------------------
// getDashboardStats
// ---------------------------------------------------------------------------
export async function getDashboardStats(req, res, next) {
  try {
    const [
      totalMembers,
      pendingMembers,
      activeMembers,
      pendingLoans,
      activeLoans,
      pendingRefunds,
      contributionsPending,
      totalContributionsResult,
      totalRepaymentsResult,
      companyFundBalance,
      paystackBalance,
      activeCycle,
      monthlyContributions,
      loanStatuses,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'MEMBER', deletedAt: null } }),
      prisma.user.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.loan.count({ where: { status: 'PENDING' } }),
      prisma.loan.count({ where: { status: { in: ['APPROVED', 'DISBURSED', 'REPAYING'] } } }),
      prisma.refund.count({ where: { status: 'PENDING' } }),
      prisma.contribution.count({ where: { status: 'PENDING_CONFIRMATION' } }),
      prisma.contribution.aggregate({ where: { status: 'PAID' }, _sum: { amountKobo: true } }),
      prisma.loanInstallment.aggregate({ where: { status: 'PAID' }, _sum: { amountKobo: true } }),
      getCurrentBalance('COMPANY_FUND'),
      paystackGetBalance().catch(() => ({ balance: 0, currency: 'NGN' })),
      prisma.cycle.findFirst({ where: { isActive: true } }),
      // Monthly contributions grouped by month
      prisma.contribution.groupBy({
        by: ['month', 'year'],
        where: { status: 'PAID' },
        _sum: { amountKobo: true },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      }),
      // Loan counts by status
      prisma.loan.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    return res.json({
      members: { total: totalMembers, pending: pendingMembers, active: activeMembers },
      loans: { pending: pendingLoans, active: activeLoans },
      refunds: { pending: pendingRefunds },
      contributions: { pending: contributionsPending },
      totalContributionsKobo: totalContributionsResult._sum.amountKobo ?? 0,
      totalRepaymentsKobo: totalRepaymentsResult._sum.amountKobo ?? 0,
      companyFundBalanceKobo: companyFundBalance,
      paystackBalanceKobo: paystackBalance.balance,
      activeCycle,
      monthlyContributions: monthlyContributions.map((m) => ({
        month: m.month,
        year: m.year,
        totalKobo: m._sum.amountKobo ?? 0,
      })),
      loansByStatus: loanStatuses.reduce((acc, l) => {
        acc[l.status] = l._count.id;
        return acc;
      }, {}),
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getPendingMembers
// ---------------------------------------------------------------------------
export async function getPendingMembers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where: { status: 'PENDING', role: 'MEMBER' },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        select: {
          id: true, fullName: true, email: true, phone: true,
          bankName: true, bankCode: true, accountNumber: true, accountName: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where: { status: 'PENDING', role: 'MEMBER' } }),
    ]);

    return res.json({ members, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// approveMember
// ---------------------------------------------------------------------------
export async function approveMember(req, res, next) {
  try {
    const { id } = req.params;
    const { memberType = 'NEW' } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE', memberType },
    });

    sendApprovalEmail(updated).catch((err) => logger.error('sendApprovalEmail failed', err));
    await createNotification(prisma, {
      userId: id,
      title: 'Account Approved',
      message: 'Your membership application has been approved. Welcome to Oma Midas!',
      type: 'ACCOUNT_APPROVED',
    });

    await logAudit(req.user.id, 'APPROVE_MEMBER', 'User', id, { memberType });

    return res.json({ message: 'Member approved', user: updated });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// rejectMember
// ---------------------------------------------------------------------------
export async function rejectMember(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });

    sendRejectionEmail(updated, reason).catch((err) => logger.error('sendRejectionEmail failed', err));
    await logAudit(req.user.id, 'REJECT_MEMBER', 'User', id, { reason });

    return res.json({ message: 'Member rejected', user: updated });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getAllMembers
// ---------------------------------------------------------------------------
export async function getAllMembers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { search, status } = req.query;

    const where = {
      role: 'MEMBER',
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true, fullName: true, email: true, phone: true,
          status: true, memberType: true, role: true,
          bankName: true, bankCode: true, accountNumber: true, accountName: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({ members, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getMemberDetail
// ---------------------------------------------------------------------------
export async function getMemberDetail(req, res, next) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, fullName: true, email: true, phone: true,
        status: true, memberType: true, role: true,
        bankName: true, bankCode: true, accountNumber: true, accountName: true,
        paystackRecipientCode: true, createdAt: true, updatedAt: true,
        contributions: { orderBy: [{ year: 'desc' }, { month: 'desc' }] },
        loans: { include: { installments: { orderBy: { dueDate: 'asc' } } }, orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ member: user });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// deactivateMember
// ---------------------------------------------------------------------------
export async function deactivateMember(req, res, next) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await logAudit(req.user.id, 'DEACTIVATE_MEMBER', 'User', id);

    return res.json({ message: 'Member deactivated' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getLoanRequests
// ---------------------------------------------------------------------------
export async function getLoanRequests(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const where = status ? { status } : {};

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, email: true, memberType: true, status: true, bankName: true, bankCode: true, accountNumber: true, accountName: true, paystackRecipientCode: true },
          },
          installments: { orderBy: { dueDate: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.loan.count({ where }),
    ]);

    return res.json({ loans, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// approveLoan
// ---------------------------------------------------------------------------
export async function approveLoan(req, res, next) {
  try {
    const { id } = req.params;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    if (loan.status !== 'PENDING') {
      return res.status(400).json({ error: `Loan is already in ${loan.status} status` });
    }

    // Check company fund has enough
    const fundBalance = await getCurrentBalance('COMPANY_FUND');
    if (fundBalance < loan.disbursedAmountKobo) {
      return res.status(400).json({
        error: `Insufficient company funds. Available: ₦${(fundBalance / 100).toFixed(2)}, Required: ₦${(loan.disbursedAmountKobo / 100).toFixed(2)}`,
      });
    }

    // Create transfer recipient if user doesn't have one
    let recipientCode = loan.user.paystackRecipientCode;
    if (!recipientCode) {
      const recipient = await createTransferRecipient({
        name: loan.user.accountName,
        accountNumber: loan.user.accountNumber,
        bankCode: loan.user.bankCode,
      }).catch((err) => {
        logger.error('createTransferRecipient failed', err);
        return null;
      });

      if (recipient?.recipient_code) {
        recipientCode = recipient.recipient_code;
        await prisma.user.update({
          where: { id: loan.userId },
          data: { paystackRecipientCode: recipientCode },
        });
      }
    }

    if (!recipientCode) {
      return res.status(400).json({ error: 'Could not create Paystack transfer recipient for this user' });
    }

    // Initiate transfer
    const transferRef = uuidv4();
    const transfer = await initiateTransfer({
      amountKobo: loan.disbursedAmountKobo,
      recipientCode,
      reason: `Oma Midas loan disbursement – ${id}`,
      reference: transferRef,
    });

    // Update loan status and record fee ledger entry in transaction
    await prisma.$transaction(async (tx) => {
      await tx.loan.update({
        where: { id },
        data: { status: 'APPROVED', paystackTransferCode: transfer.transfer_code },
      });

      // Record the fee as a credit to company fund immediately (30% stays in)
      await appendLedgerEntry(tx, {
        type: 'LOAN_FEE',
        ledger: 'COMPANY_FUND',
        userId: loan.userId,
        loanId: id,
        amountKobo: loan.feeKobo,
        reference: `fee-approve-${id}-${uuidv4()}`,
      });
    });

    sendLoanApprovalEmail(loan.user, loan).catch((err) => logger.error('sendLoanApprovalEmail failed', err));
    await createNotification(prisma, {
      userId: loan.userId,
      title: 'Loan Approved',
      message: `Your loan of ₦${(loan.disbursedAmountKobo / 100).toFixed(2)} has been approved and is being disbursed.`,
      type: 'LOAN_APPROVED',
    });

    await logAudit(req.user.id, 'APPROVE_LOAN', 'Loan', id, { transferRef });

    return res.json({ message: 'Loan approved and transfer initiated' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// rejectLoan
// ---------------------------------------------------------------------------
export async function rejectLoan(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    await prisma.loan.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });

    sendLoanRejectionEmail(loan.user, { ...loan, rejectionReason: reason }).catch((err) =>
      logger.error('sendLoanRejectionEmail failed', err)
    );
    await createNotification(prisma, {
      userId: loan.userId,
      title: 'Loan Application Rejected',
      message: reason || 'Your loan application has been rejected.',
      type: 'LOAN_REJECTED',
    });

    await logAudit(req.user.id, 'REJECT_LOAN', 'Loan', id, { reason });

    return res.json({ message: 'Loan rejected' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getRefundRequests
// ---------------------------------------------------------------------------
export async function getRefundRequests(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const where = status ? { status } : {};

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, accountNumber: true, bankName: true, bankCode: true, accountName: true, paystackRecipientCode: true } },
          cycle: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.refund.count({ where }),
    ]);

    return res.json({ refunds, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// approveRefund
// ---------------------------------------------------------------------------
export async function approveRefund(req, res, next) {
  try {
    const { id } = req.params;

    const refund = await prisma.refund.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!refund) return res.status(404).json({ error: 'Refund not found' });
    if (refund.status !== 'PENDING') {
      return res.status(400).json({ error: `Refund is already in ${refund.status} status` });
    }

    // Check no outstanding loans
    const outstandingLoan = await prisma.loan.findFirst({
      where: { userId: refund.userId, status: { in: ['DISBURSED', 'REPAYING'] } },
    });

    if (outstandingLoan) {
      return res.status(400).json({ error: 'User has an outstanding loan — refund cannot be approved' });
    }

    // Create or retrieve transfer recipient
    let recipientCode = refund.user.paystackRecipientCode;
    if (!recipientCode) {
      const recipient = await createTransferRecipient({
        name: refund.user.accountName,
        accountNumber: refund.user.accountNumber,
        bankCode: refund.user.bankCode,
      }).catch(() => null);

      if (recipient?.recipient_code) {
        recipientCode = recipient.recipient_code;
        await prisma.user.update({
          where: { id: refund.userId },
          data: { paystackRecipientCode: recipientCode },
        });
      }
    }

    if (!recipientCode) {
      return res.status(400).json({ error: 'Could not create Paystack transfer recipient' });
    }

    const transferRef = uuidv4();
    const transfer = await initiateTransfer({
      amountKobo: refund.amountKobo,
      recipientCode,
      reason: `Oma Midas savings refund – ${id}`,
      reference: transferRef,
    });

    await prisma.refund.update({
      where: { id },
      data: { status: 'APPROVED', paystackTransferCode: transfer.transfer_code },
    });

    sendRefundApprovalEmail(refund.user, refund).catch((err) => logger.error('sendRefundApprovalEmail failed', err));
    await logAudit(req.user.id, 'APPROVE_REFUND', 'Refund', id, { transferRef });

    return res.json({ message: 'Refund approved and transfer initiated' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// rejectRefund
// ---------------------------------------------------------------------------
export async function rejectRefund(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const refund = await prisma.refund.findUnique({ where: { id } });
    if (!refund) return res.status(404).json({ error: 'Refund not found' });

    await prisma.refund.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });

    await logAudit(req.user.id, 'REJECT_REFUND', 'Refund', id, { reason });

    return res.json({ message: 'Refund rejected' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getCompanyFundBalance
// ---------------------------------------------------------------------------
export async function getCompanyFundBalance(req, res, next) {
  try {
    const [ledgerBalance, paystackBalance] = await Promise.all([
      getCurrentBalance('COMPANY_FUND'),
      paystackGetBalance().catch(() => ({ balance: 0 })),
    ]);

    return res.json({
      ledgerBalanceKobo: ledgerBalance,
      paystackBalanceKobo: paystackBalance.balance,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// recordFundTopup
// ---------------------------------------------------------------------------
export async function recordFundTopup(req, res, next) {
  try {
    const { amountKobo, reference, note } = req.body;

    if (!amountKobo || !reference) {
      return res.status(422).json({ error: 'amountKobo and reference are required' });
    }

    const entry = await prisma.$transaction(async (tx) => {
      return appendLedgerEntry(tx, {
        type: 'FUND_TOPUP',
        ledger: 'COMPANY_FUND',
        amountKobo,
        reference,
      });
    });

    await logAudit(req.user.id, 'FUND_TOPUP', 'LedgerEntry', entry.id, { amountKobo, reference, note });

    return res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getAllTransactions
// ---------------------------------------------------------------------------
export async function getAllTransactions(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;
    const { type, ledger, startDate, endDate, format } = req.query;

    const where = {
      ...(type && { type }),
      ...(ledger && { ledger }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    if (format === 'csv') {
      // Export all matching entries
      const entries = await prisma.ledgerEntry.findMany({
        where,
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });

      const headers = 'ID,Type,Ledger,User,Amount (₦),Balance After (₦),Reference,Date\n';
      const rows = entries.map((e) => {
        const user = e.user ? `${e.user.fullName} <${e.user.email}>` : 'N/A';
        return [
          e.id,
          e.type,
          e.ledger,
          `"${user}"`,
          (e.amountKobo / 100).toFixed(2),
          (e.balanceAfterKobo / 100).toFixed(2),
          e.reference,
          e.createdAt.toISOString(),
        ].join(',');
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
      return res.send(headers + rows.join('\n'));
    }

    const [entries, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ledgerEntry.count({ where }),
    ]);

    return res.json({ transactions: entries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getAuditLogs
// ---------------------------------------------------------------------------
export async function getAuditLogs(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { admin: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count(),
    ]);

    return res.json({ logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getSettings
// ---------------------------------------------------------------------------
export async function getSettings(req, res, next) {
  try {
    const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return res.json({ settings: map });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getSetting (single key)
// ---------------------------------------------------------------------------
export async function getSetting(req, res, next) {
  try {
    const { key } = req.params;
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (!setting) return res.status(404).json({ error: 'Setting not found' });
    return res.json({ key: setting.key, value: setting.value, setting });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// updateSetting
// ---------------------------------------------------------------------------
export async function updateSetting(req, res, next) {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined || value === null) {
      return res.status(422).json({ error: 'value is required' });
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    await logAudit(req.user.id, 'UPDATE_SETTING', 'Setting', setting.id, { key, value });

    return res.json({ setting });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// startNewCycle
// ---------------------------------------------------------------------------
export async function startNewCycle(req, res, next) {
  try {
    const currentCycle = await prisma.cycle.findFirst({ where: { isActive: true } });

    // Deactivate current cycle
    if (currentCycle) {
      await prisma.cycle.update({
        where: { id: currentCycle.id },
        data: { isActive: false },
      });
    }

    // New cycle starts Oct 1 of next year
    const now = new Date();
    const nextYear = now.getFullYear() + 1;
    const startDate = new Date(`${nextYear}-10-01`);
    const endDate = new Date(`${nextYear + 1}-09-30`);

    const newCycle = await prisma.cycle.create({
      data: { startDate, endDate, isActive: true },
    });

    // All ACTIVE members become EXISTING for the new cycle
    await prisma.user.updateMany({
      where: { status: 'ACTIVE', role: 'MEMBER' },
      data: { memberType: 'EXISTING' },
    });

    await logAudit(req.user.id, 'START_NEW_CYCLE', 'Cycle', newCycle.id, {
      previousCycleId: currentCycle?.id,
      startDate,
      endDate,
    });

    return res.status(201).json({ message: 'New cycle started', cycle: newCycle });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getCycleInfo (public helper mounted separately)
// ---------------------------------------------------------------------------
export async function getCycleInfo(req, res, next) {
  try {
    const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
    if (!cycle) return res.status(404).json({ error: 'No active cycle' });
    return res.json({ cycle });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getLoanSummary — per-member loan breakdown
// ---------------------------------------------------------------------------
export async function getLoanSummary(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || '';

    // Get all members who have at least one loan
    const whereUser = {
      deletedAt: null,
      role: 'MEMBER',
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [members, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereUser,
        skip,
        take: limit,
        orderBy: { fullName: 'asc' },
        include: {
          loans: {
            select: {
              id: true,
              requestedAmountKobo: true,
              disbursedAmountKobo: true,
              totalRepayableKobo: true,
              status: true,
              installments: {
                select: { amountKobo: true, status: true },
              },
            },
          },
        },
      }),
      prisma.user.count({ where: whereUser }),
    ]);

    // Build per-member summary
    const rows = members.map((member) => {
      let totalCollectedKobo = 0;
      let totalRepaidKobo = 0;
      let activeLoanStatus = null;

      for (const loan of member.loans) {
        // Only count disbursed/repaying/completed loans as "collected"
        if (['DISBURSED', 'REPAYING', 'COMPLETED'].includes(loan.status)) {
          totalCollectedKobo += loan.disbursedAmountKobo;
        }
        // Repaid = sum of PAID installments
        for (const inst of loan.installments) {
          if (inst.status === 'PAID') {
            totalRepaidKobo += inst.amountKobo;
          }
        }
        // Track active loan status (DISBURSED or REPAYING)
        if (['APPROVED', 'DISBURSED', 'REPAYING'].includes(loan.status)) {
          activeLoanStatus = loan.status;
        }
      }

      // Outstanding = total repayable of active loans minus what's been repaid on those loans
      let outstandingKobo = 0;
      for (const loan of member.loans) {
        if (['DISBURSED', 'REPAYING'].includes(loan.status)) {
          const repaidOnLoan = loan.installments
            .filter((i) => i.status === 'PAID')
            .reduce((s, i) => s + i.amountKobo, 0);
          outstandingKobo += loan.totalRepayableKobo - repaidOnLoan;
        }
      }

      return {
        userId: member.id,
        fullName: member.fullName,
        email: member.email,
        activeLoanStatus,
        totalCollectedKobo,
        totalRepaidKobo,
        outstandingKobo: Math.max(0, outstandingKobo),
      };
    });

    // Aggregate totals across all matching members (not just this page)
    const allLoans = await prisma.loan.findMany({
      where: {
        user: whereUser,
        status: { in: ['DISBURSED', 'REPAYING', 'COMPLETED'] },
      },
      include: { installments: { select: { amountKobo: true, status: true } } },
    });

    let totalCollected = 0;
    let totalRepaid = 0;
    let totalOutstanding = 0;

    for (const loan of allLoans) {
      totalCollected += loan.disbursedAmountKobo;
      const repaidOnLoan = loan.installments
        .filter((i) => i.status === 'PAID')
        .reduce((s, i) => s + i.amountKobo, 0);
      totalRepaid += repaidOnLoan;
      if (['DISBURSED', 'REPAYING'].includes(loan.status)) {
        totalOutstanding += Math.max(0, loan.totalRepayableKobo - repaidOnLoan);
      }
    }

    return res.json({
      rows,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      page,
      totals: {
        collected: totalCollected,
        repaid: totalRepaid,
        balance: totalOutstanding,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getPendingContributions — admin: list all PENDING_CONFIRMATION contributions
// ---------------------------------------------------------------------------
export async function getPendingContributions(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [contributions, total] = await Promise.all([
      prisma.contribution.findMany({
        where: { status: 'PENDING_CONFIRMATION' },
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          cycle: { select: { id: true, startDate: true, endDate: true } },
        },
        orderBy: { submittedAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.contribution.count({ where: { status: 'PENDING_CONFIRMATION' } }),
    ]);

    return res.json({
      contributions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// approveContribution — admin: confirm contribution payment
// ---------------------------------------------------------------------------
export async function approveContribution(req, res, next) {
  try {
    const { id } = req.params;

    const contribution = await prisma.contribution.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!contribution) return res.status(404).json({ error: 'Contribution not found' });
    if (contribution.status !== 'PENDING_CONFIRMATION') {
      return res.status(400).json({ error: `Contribution is not pending confirmation (status: ${contribution.status})` });
    }

    const now = new Date();
    const amountKobo = contribution.amountSubmittedKobo || contribution.amountKobo;

    await prisma.$transaction(async (tx) => {
      await tx.contribution.update({
        where: { id },
        data: { status: 'PAID', amountKobo, paidAt: now },
      });

      // Dynamic import to avoid circular deps
      const { appendLedgerEntry } = await import('../services/ledger.service.js');
      const reference = `contribution-${id}-${Date.now()}`;

      await appendLedgerEntry(tx, {
        type: 'CONTRIBUTION',
        ledger: 'SAVINGS',
        userId: contribution.userId,
        amountKobo,
        reference,
      });
    });

    const monthName = new Date(contribution.year, contribution.month - 1).toLocaleString('en-NG', { month: 'long' });
    const amountNaira = (amountKobo / 100).toLocaleString('en-NG');

    await createNotification(prisma, {
      userId: contribution.userId,
      title: 'Contribution Confirmed',
      message: `Your contribution of ₦${amountNaira} for ${monthName} ${contribution.year} has been confirmed.`,
      type: 'CONTRIBUTION_CONFIRMED',
    }).catch((err) => logger.error('createNotification failed', err));

    sendContributionConfirmedEmail(contribution.user, {
      month: contribution.month,
      year: contribution.year,
      amountKobo,
    }).catch((err) => logger.error('sendContributionConfirmedEmail failed', err));

    await logAudit(req.user.id, 'APPROVE_CONTRIBUTION', 'Contribution', id, {
      amountKobo,
      month: contribution.month,
      year: contribution.year,
    });

    return res.json({ message: 'Contribution approved' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// rejectContribution — admin: reject a submitted contribution payment
// ---------------------------------------------------------------------------
export async function rejectContribution(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const contribution = await prisma.contribution.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!contribution) return res.status(404).json({ error: 'Contribution not found' });
    if (contribution.status !== 'PENDING_CONFIRMATION') {
      return res.status(400).json({ error: `Contribution is not pending confirmation (status: ${contribution.status})` });
    }

    await prisma.contribution.update({
      where: { id },
      data: {
        status: 'PENDING',
        rejectionReason: reason || null,
        amountSubmittedKobo: null,
        submittedAt: null,
      },
    });

    const monthName = new Date(contribution.year, contribution.month - 1).toLocaleString('en-NG', { month: 'long' });

    await createNotification(prisma, {
      userId: contribution.userId,
      title: 'Contribution Payment Not Confirmed',
      message: `Your contribution payment for ${monthName} ${contribution.year} was not confirmed. Reason: ${reason || 'Not specified'}`,
      type: 'CONTRIBUTION_REJECTED',
    }).catch((err) => logger.error('createNotification failed', err));

    sendContributionRejectedEmail(contribution.user, {
      month: contribution.month,
      year: contribution.year,
      reason,
    }).catch((err) => logger.error('sendContributionRejectedEmail failed', err));

    await logAudit(req.user.id, 'REJECT_CONTRIBUTION', 'Contribution', id, {
      reason,
      month: contribution.month,
      year: contribution.year,
    });

    return res.json({ message: 'Contribution rejected' });
  } catch (err) {
    next(err);
  }
}
