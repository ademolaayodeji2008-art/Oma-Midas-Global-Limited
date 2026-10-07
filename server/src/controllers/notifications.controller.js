/**
 * notifications.controller.js — In-app notification endpoints.
 */

import { PrismaClient } from '@prisma/client';
import {
  markNotificationsRead,
  getUnreadCount as serviceGetUnreadCount,
} from '../services/notification.service.js';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// getNotifications — paginated list
// ---------------------------------------------------------------------------
export async function getNotifications(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId: req.user.id } }),
    ]);

    return res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// markRead
// ---------------------------------------------------------------------------
export async function markRead(req, res, next) {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(422).json({ error: 'ids must be a non-empty array' });
    }

    await markNotificationsRead(req.user.id, ids);
    return res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// getUnreadCount
// ---------------------------------------------------------------------------
export async function getUnreadCount(req, res, next) {
  try {
    const count = await serviceGetUnreadCount(req.user.id);
    return res.json({ count });
  } catch (err) {
    next(err);
  }
}
