/**
 * server.js — Oma Midas Global Limited Express application entry point.
 *
 * Middleware order:
 *   1. Sentry (if configured)
 *   2. Helmet (security headers)
 *   3. CORS
 *   4. express.json (with raw-body capture for Paystack webhook)
 *   5. cookie-parser
 *   6. Morgan (HTTP logging)
 *   7. Routes
 *   8. Global error handler
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/node';

import authRoutes from './src/routes/auth.routes.js';
import contributionRoutes from './src/routes/contributions.routes.js';
import loanRoutes from './src/routes/loans.routes.js';
import refundRoutes from './src/routes/refunds.routes.js';
import notificationRoutes from './src/routes/notifications.routes.js';
import paystackRoutes from './src/routes/paystack.routes.js';
import adminRoutes from './src/routes/admin.routes.js';

import { errorHandler } from './src/middleware/errorHandler.middleware.js';
import { generalLimiter } from './src/middleware/rateLimiter.middleware.js';
import { getCycleInfo } from './src/controllers/admin.controller.js';

import { startReconciliationJob } from './src/jobs/reconciliation.job.js';
import { startReminderJob } from './src/jobs/reminder.job.js';
import { startKeepaliveJob } from './src/jobs/keepalive.job.js';

import logger from './src/utils/logger.js';

// ---------------------------------------------------------------------------
// Sentry (optional — only when SENTRY_DSN is set)
// ---------------------------------------------------------------------------
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

// Sentry request handler must be the first middleware
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
}

// Security headers
app.use(helmet());

// CORS — only the configured frontend origin with credentials
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsing — capture raw body buffer for Paystack webhook HMAC verification
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

// Cookie parsing
app.use(cookieParser());

// HTTP request logging
app.use(morgan('dev'));

// General rate limiter (applied globally; auth routes have their own tighter limiter)
app.use(generalLimiter);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/paystack', paystackRoutes);
app.use('/api/admin', adminRoutes);

// Public cycle endpoint
app.get('/api/cycle', getCycleInfo);

// Health check
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: 'ok', timestamp: new Date() });
  } catch (err) {
    logger.error('Health check DB query failed', err);
    return res.status(503).json({ status: 'error', timestamp: new Date() });
  }
});

// ---------------------------------------------------------------------------
// Sentry error handler (before our own error handler)
// ---------------------------------------------------------------------------
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Global error handler (must be last)
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Verify DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connected');
  } catch (err) {
    logger.error('Database connection failed — aborting startup', err);
    process.exit(1);
  }

  // Start cron jobs
  startReconciliationJob();
  startReminderJob();
  startKeepaliveJob();

  // Optional weekly backup cron (set ENABLE_BACKUP_CRON=true to enable)
  if (process.env.ENABLE_BACKUP_CRON === 'true') {
    import('./scripts/backup.cron.js').then(({ startBackupCronJob }) => {
      startBackupCronJob();
    }).catch((err) => {
      logger.error('Failed to start backup cron job', err);
    });
  }

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    console.log(`Server running on port ${PORT}`);
  });
}

start();

export default app;
