/**
 * paystack.routes.js — Paystack webhook and utility routes.
 *
 * The webhook route uses express.raw() to capture the raw body for HMAC verification.
 * The raw body is stored on req.rawBody by the verify callback in server.js,
 * but this route also adds its own raw-body handler as a fallback.
 */

import { Router } from 'express';
import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  webhook,
  resolveAccount,
  listBanks,
} from '../controllers/paystack.controller.js';

const router = Router();

// Webhook: no auth, needs raw body for signature verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    // If raw body came through as Buffer, set it; server.js verify callback also sets this
    if (Buffer.isBuffer(req.body)) {
      req.rawBody = req.body.toString('utf8');
      // Re-parse body as JSON for controller use
      try {
        req.body = JSON.parse(req.rawBody);
      } catch {
        req.body = {};
      }
    }
    next();
  },
  webhook
);

// Resolve account number (public — used on Signup page before auth exists)
router.get('/resolve-account', resolveAccount);

// List banks (public)
router.get('/banks', listBanks);

export default router;
