/**
 * reminder.job.js — Daily reminder cron (9 AM).
 *
 * - Sends contribution reminders to ACTIVE members who haven't paid this month.
 * - Sends installment reminders for upcoming/overdue installments.
 * - Marks overdue installments.
 * Deduplicates by checking if a reminder notification was already sent today.
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import {
  sendContributionReminderEmail,
  sendLoanInstallmentReminderEmail,
} from '../services/email.service.js';
import { createNotification } from '../services/notification.service.js';
import { getContributionPeriod } from '../utils/cycleHelpers.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

async function remind() {
  logger.info('Reminder job started');
  let remindersSent = 0;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // Find active cycle
  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) {
    logger.info('No active cycle — skipping contribution reminders');
  } else {
    const { month, year } = getContributionPeriod();

    // (a) Contribution reminders for ACTIVE members
    const activeMembers = await prisma.user.findMany({
      where: { status: 'ACTIVE', role: 'MEMBER', deletedAt: null },
      select: { id: true, fullName: true, email: true },
    });

    for (const member of activeMembers) {
      try {
        const contribution = await prisma.contribution.findUnique({
          where: {
            userId_cycleId_month_year: {
              userId: member.id,
              cycleId: cycle.id,
              month,
              year,
            },
          },
        });

        if (contribution?.status === 'PAID') continue;

        // Check if reminder already sent today
        const existing = await prisma.notification.findFirst({
          where: {
            userId: member.id,
            type: 'CONTRIBUTION_REMINDER',
            createdAt: { gte: todayStart, lt: todayEnd },
          },
        });

        if (existing) continue;

        await createNotification(prisma, {
          userId: member.id,
          title: 'Monthly Contribution Reminder',
          message: `Your contribution for ${month}/${year} is still due. Please make your payment.`,
          type: 'CONTRIBUTION_REMINDER',
        });

        sendContributionReminderEmail(member, month, year).catch((err) =>
          logger.error(`Contribution reminder email failed for ${member.email}`, err)
        );

        remindersSent++;
      } catch (err) {
        logger.error(`Contribution reminder failed for ${member.id}`, err);
      }
    }
  }

  // (b) Installment reminders (due within next 3 days)
  const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  const upcomingInstallments = await prisma.loanInstallment.findMany({
    where: {
      status: { in: ['PENDING', 'OVERDUE'] },
      dueDate: { lte: threeDaysFromNow },
    },
    include: {
      loan: {
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });

  for (const installment of upcomingInstallments) {
    try {
      const member = installment.loan.user;

      // Dedup check
      const existing = await prisma.notification.findFirst({
        where: {
          userId: member.id,
          type: 'INSTALLMENT_REMINDER',
          createdAt: { gte: todayStart, lt: todayEnd },
        },
      });

      if (existing) continue;

      await createNotification(prisma, {
        userId: member.id,
        title: 'Loan Repayment Reminder',
        message: `A loan installment of ₦${(installment.amountKobo / 100).toFixed(2)} is due on ${new Date(installment.dueDate).toLocaleDateString()}.`,
        type: 'INSTALLMENT_REMINDER',
      });

      sendLoanInstallmentReminderEmail(member, installment).catch((err) =>
        logger.error(`Installment reminder email failed for ${member.email}`, err)
      );

      remindersSent++;
    } catch (err) {
      logger.error(`Installment reminder failed for ${installment.id}`, err);
    }
  }

  // (c) Mark overdue installments
  const overdueCount = await prisma.loanInstallment.updateMany({
    where: {
      status: 'PENDING',
      dueDate: { lt: today },
    },
    data: { status: 'OVERDUE' },
  });

  if (overdueCount.count > 0) {
    logger.info(`Marked ${overdueCount.count} installments as OVERDUE`);
  }

  logger.info(`Reminder job complete. ${remindersSent} reminders sent.`);
}

export function startReminderJob() {
  // Daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    await remind().catch((err) => logger.error('Reminder job failed', err));
  });

  logger.info('Reminder job scheduled (daily at 9 AM)');
}
