/**
 * rateLimiter.middleware.js — Rate limiting middleware using express-rate-limit.
 *
 * authLimiter    — 10 requests per 15 minutes (used on all auth endpoints)
 * generalLimiter — 60 requests per minute (used on general API routes)
 */

import rateLimit from 'express-rate-limit';

/** Rate limiter for authentication endpoints. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

/** Rate limiter for general API usage. */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
