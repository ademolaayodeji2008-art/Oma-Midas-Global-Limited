/**
 * clearance.routes.js — Clearance Card routes.
 *
 * Mounted at /api/clearance-card in server.js.
 *
 * GET /               → authenticate → getMyClearanceCard (member)
 * GET /admin/:id      → authenticate → adminOnly → getAdminMemberClearanceCard
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/adminOnly.middleware.js';
import {
  getMyClearanceCard,
  getAdminMemberClearanceCard,
} from '../controllers/clearance.controller.js';

const router = Router();

// Member: get own clearance card
router.get('/', authenticate, getMyClearanceCard);

// Admin: get any member's clearance card
router.get('/admin/:id', authenticate, adminOnly, getAdminMemberClearanceCard);

export default router;
