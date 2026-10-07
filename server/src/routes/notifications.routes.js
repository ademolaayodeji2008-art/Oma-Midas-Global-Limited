/**
 * notifications.routes.js — In-app notification routes.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getNotifications,
  markRead,
  getUnreadCount,
} from '../controllers/notifications.controller.js';

const router = Router();

router.get('/', authenticate, getNotifications);
router.put('/read', authenticate, markRead);
router.get('/unread-count', authenticate, getUnreadCount);

export default router;
