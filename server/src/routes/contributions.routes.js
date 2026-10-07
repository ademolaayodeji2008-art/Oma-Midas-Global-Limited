/**
 * contributions.routes.js — Member contribution routes.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getMyContributions,
  getContributionStatus,
  initializePayment,
  getConsistentStreak,
  getMonthlyAmount,
} from '../controllers/contributions.controller.js';

const router = Router();

router.get('/', authenticate, getMyContributions);
router.get('/status', authenticate, getContributionStatus);
router.post('/initialize-payment', authenticate, initializePayment);
router.get('/streak', authenticate, getConsistentStreak);
router.get('/monthly-amount', authenticate, getMonthlyAmount);

export default router;
