/**
 * loans.routes.js — Member loan routes.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  checkEligibility,
  requestLoan,
  getMyLoans,
  getMyCurrentLoan,
  submitInstallmentPayment,
  getMyLoanSummary,
} from '../controllers/loans.controller.js';

const router = Router();

router.get('/eligibility', authenticate, checkEligibility);
router.post('/', authenticate, requestLoan);
router.get('/summary', authenticate, getMyLoanSummary);
router.get('/', authenticate, getMyLoans);
router.get('/current', authenticate, getMyCurrentLoan);
router.post('/repayment/submit', authenticate, submitInstallmentPayment);

export default router;
