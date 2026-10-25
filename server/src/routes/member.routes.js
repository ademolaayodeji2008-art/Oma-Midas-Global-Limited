/**
 * member.routes.js — Member-specific routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getMyTransactions, getMyFinancialSummary } from '../controllers/member.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Transaction history
router.get('/transactions', getMyTransactions);

// Financial summary
router.get('/financial-summary', getMyFinancialSummary);

export default router;
