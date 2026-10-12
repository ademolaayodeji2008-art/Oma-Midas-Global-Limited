/**
 * clearance.routes.js — Clearance Card routes.
 *
 * Mounted at /api/clearance-card in server.js.
 *
 * GET  /                      → authenticate → getMyClearanceCard (member)
 * POST /request               → authenticate → requestClearanceAuth (member)
 * GET  /admin/pending         → authenticate → adminOnly → getPendingClearanceRequests
 * GET  /admin/:id             → authenticate → adminOnly → getAdminMemberClearanceCard
 * PUT  /admin/:id/authorize   → authenticate → adminOnly → authorizeClearance
 * PUT  /admin/:id/deny        → authenticate → adminOnly → denyClearance
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/adminOnly.middleware.js';
import {
  getMyClearanceCard,
  getAdminMemberClearanceCard,
  requestClearanceAuth,
  authorizeClearance,
  denyClearance,
  getPendingClearanceRequests,
} from '../controllers/clearance.controller.js';

const router = Router();

// Member: get own clearance card (authorization-gated)
router.get('/', authenticate, getMyClearanceCard);

// Member: request clearance card authorization
router.post('/request', authenticate, requestClearanceAuth);

// Admin: list pending clearance requests (must come before /admin/:id)
router.get('/admin/pending', authenticate, adminOnly, getPendingClearanceRequests);

// Admin: get any member's clearance card
router.get('/admin/:id', authenticate, adminOnly, getAdminMemberClearanceCard);

// Admin: authorize a member's clearance card
router.put('/admin/:id/authorize', authenticate, adminOnly, authorizeClearance);

// Admin: deny a member's clearance card request
router.put('/admin/:id/deny', authenticate, adminOnly, denyClearance);

export default router;
