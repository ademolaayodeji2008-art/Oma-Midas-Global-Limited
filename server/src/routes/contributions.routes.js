/**
 * contributions.routes.js — Member contribution routes.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getMyContributions,
  getContributionStatus,
  getBankDetails,
  submitPayment,
  getConsistentStreak,
  getMonthlyAmount,
} from '../controllers/contributions.controller.js';

const router = Router();

router.get('/', authenticate, getMyContributions);
router.get('/status', authenticate, getContributionStatus);
router.get('/bank-details', authenticate, getBankDetails);
router.post('/submit-payment', authenticate, submitPayment);
router.get('/streak', authenticate, getConsistentStreak);
router.get('/monthly-amount', authenticate, getMonthlyAmount);

export default router;
