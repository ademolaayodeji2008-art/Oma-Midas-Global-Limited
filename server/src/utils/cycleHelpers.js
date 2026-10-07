/**
 * cycleHelpers.js — Cooperative cycle utility helpers
 *
 * Helpers for working with the Cycle model: fetching the active cycle,
 * checking contribution eligibility, and computing date windows.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Retrieve the currently active cooperative cycle.
 * @returns {Promise<import('@prisma/client').Cycle|null>}
 */
export async function getActiveCycle() {
  return prisma.cycle.findFirst({ where: { isActive: true } });
}

/**
 * Derive the contribution month and year from a given Date object.
 * @param {Date} [date=new Date()] - The reference date (defaults to now)
 * @returns {{ month: number, year: number }} month is 1-indexed (1=January)
 */
export function getContributionPeriod(date = new Date()) {
  return {
    month: date.getMonth() + 1, // JS months are 0-indexed
    year: date.getFullYear(),
  };
}

/**
 * Check whether a given date falls within a cycle's active window.
 * @param {import('@prisma/client').Cycle} cycle
 * @param {Date} [date=new Date()]
 * @returns {boolean}
 */
export function isDateInCycle(cycle, date = new Date()) {
  return date >= new Date(cycle.startDate) && date <= new Date(cycle.endDate);
}

/**
 * Count the number of consecutive paid contribution months for a user
 * within the current active cycle, counting backwards from today.
 * @param {string} userId
 * @param {string} cycleId
 * @returns {Promise<number>}
 */
export async function countConsecutivePaidMonths(userId, cycleId) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let consecutive = 0;
  let month = currentMonth;
  let year = currentYear;

  // Walk backwards month by month until we find an unpaid or missing contribution
  for (let i = 0; i < 24; i++) {
    // cap at 2 years to prevent infinite loops
    // eslint-disable-next-line no-await-in-loop
    const contribution = await prisma.contribution.findUnique({
      where: {
        userId_cycleId_month_year: { userId, cycleId, month, year },
      },
    });

    if (!contribution || contribution.status !== 'PAID') break;

    consecutive += 1;

    // Move back one month
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  return consecutive;
}
