/**
 * prisma.js — Singleton Prisma client with automatic reconnection.
 * Supabase free tier drops idle connections; this wrapper retries on disconnect.
 */

import { PrismaClient } from '@prisma/client';
import logger from './logger.js';

let prisma;

function createPrismaClient() {
  const client = new PrismaClient({
    log: ['error'],
    errorFormat: 'pretty',
  });

  // Log slow queries in development
  if (process.env.NODE_ENV === 'development') {
    client.$on('query', (e) => {
      if (e.duration > 2000) {
        logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
      }
    });
  }

  return client;
}

if (!prisma) {
  prisma = createPrismaClient();
}

/**
 * Execute a Prisma operation with automatic retry on connection errors.
 * Retries once after a 1s delay if the connection was dropped.
 */
export async function withRetry(fn, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn(prisma);
    } catch (err) {
      const isConnErr =
        err.message?.includes("Can't reach database") ||
        err.message?.includes('connection pool') ||
        err.message?.includes('ECONNRESET') ||
        err.message?.includes('Timed out');

      if (isConnErr && attempt < retries) {
        logger.warn(`DB connection error (attempt ${attempt}), reconnecting...`);
        try {
          await prisma.$disconnect();
        } catch (_) {}
        prisma = createPrismaClient();
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw err;
    }
  }
}

export default prisma;
