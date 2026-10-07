/**
 * errorHandler.middleware.js — Global Express error handler.
 *
 * - Maps Prisma error codes to appropriate HTTP status codes.
 * - Hides internal details (stack traces) in production.
 * - Always logs to the application logger.
 */

import logger from '../utils/logger.js';

/**
 * Global error-handling middleware (4-argument signature required by Express).
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  logger.error(err.message, err);

  // Prisma constraint violation — unique key
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with those details already exists' });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  const statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'production') {
    return res.status(statusCode).json({ error: 'Internal server error' });
  }

  return res.status(statusCode).json({
    error: err.message,
    stack: err.stack,
  });
}
