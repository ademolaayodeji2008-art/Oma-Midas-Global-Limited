/**
 * refunds.routes.js — Member refund routes.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requestRefund, getMyRefunds } from '../controllers/refunds.controller.js';

const router = Router();

router.post('/', authenticate, requestRefund);
router.get('/', authenticate, getMyRefunds);

export default router;
