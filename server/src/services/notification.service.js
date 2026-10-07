/**
 * notification.service.js — In-app notification management.
 *
 * createNotification — accepts a Prisma transaction client (safe to use inside $transaction).
 * markNotificationsRead / getUnreadCount — use the global Prisma client directly.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new notification for a user.
 * Must be called with the Prisma transaction client when used inside $transaction.
 *
 * @param {import('@prisma/client').PrismaClient} prismaClient - tx client or global prisma
 * @param {{userId:string, title:string, message:string, type:string}} params
 * @returns {Promise<import('@prisma/client').Notification>}
 */
export async function createNotification(prismaClient, { userId, title, message, type }) {
  return prismaClient.notification.create({
    data: { userId, title, message, type },
  });
}

/**
 * Mark a list of notifications as read for a given user.
 * Only updates notifications that belong to the specified user.
 *
 * @param {string} userId
 * @param {string[]} ids - Array of notification IDs to mark as read
 * @returns {Promise<import('@prisma/client').Prisma.BatchPayload>}
 */
export async function markNotificationsRead(userId, ids) {
  return prisma.notification.updateMany({
    where: {
      id: { in: ids },
      userId,
    },
    data: { isRead: true },
  });
}

/**
 * Get the count of unread notifications for a user.
 *
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getUnreadCount(userId) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}
