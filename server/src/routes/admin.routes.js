/**
 * admin.routes.js — Administrative routes.
 * All routes require authenticate + adminOnly.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/adminOnly.middleware.js';
import {
  getDashboardStats,
  getPendingMembers,
  approveMember,
  rejectMember,
  getAllMembers,
  getMemberDetail,
  deactivateMember,
  getLoanRequests,
  approveLoan,
  rejectLoan,
  getRefundRequests,
  approveRefund,
  rejectRefund,
  getCompanyFundBalance,
  recordFundTopup,
  getAllTransactions,
  getAuditLogs,
  getSettings,
  getSetting,
  updateSetting,
  startNewCycle,
  getLoanSummary,
  getPendingContributions,
  approveContribution,
  rejectContribution,
} from '../controllers/admin.controller.js';

const router = Router();

// Apply authenticate + adminOnly to all admin routes
router.use(authenticate, adminOnly);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Member management
router.get('/members/pending', getPendingMembers);
router.get('/members', getAllMembers);
router.get('/members/:id', getMemberDetail);
router.put('/members/:id/approve', approveMember);
router.put('/members/:id/reject', rejectMember);
router.delete('/members/:id', deactivateMember);

// Loan management
router.get('/loans', getLoanRequests);
router.get('/loans/summary', getLoanSummary);
router.put('/loans/:id/approve', approveLoan);
router.put('/loans/:id/reject', rejectLoan);

// Refund management
router.get('/refunds', getRefundRequests);
router.put('/refunds/:id/approve', approveRefund);
router.put('/refunds/:id/reject', rejectRefund);

// Company fund
router.get('/company-fund', getCompanyFundBalance);
router.post('/company-fund/topup', recordFundTopup);

// Transactions
router.get('/transactions', getAllTransactions);

// Audit logs
router.get('/audit-logs', getAuditLogs);

// Settings
router.get('/settings', getSettings);
router.get('/settings/:key', getSetting);
router.put('/settings/:key', updateSetting);

// Cycles
router.post('/cycles/new', startNewCycle);

// Contribution management (manual bank transfer flow)
router.get('/contributions/pending', getPendingContributions);
router.put('/contributions/:id/approve', approveContribution);
router.put('/contributions/:id/reject', rejectContribution);

export default router;
