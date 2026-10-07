/**
 * keepalive.job.js — Daily DB keepalive ping (3 AM).
 * Prevents Supabase/Postgres from going idle on free-tier plans.
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export function startKeepaliveJob() {
  // Daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('DB keepalive ping successful');
    } catch (err) {
      logger.error('DB keepalive ping failed', err);
    }
  });

  logger.info('Keepalive job scheduled (daily at 3 AM)');
}
