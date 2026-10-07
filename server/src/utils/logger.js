/**
 * logger.js — Application-level structured logger
 *
 * Prepends an ISO timestamp to every log entry.
 * If SENTRY_DSN is set, initialises Sentry and captures errors automatically.
 *
 * SECURITY: never log passwords, JWT secrets, or Paystack secret keys.
 * Callers are responsible for scrubbing sensitive fields from `meta` before
 * passing it here.
 */

import * as Sentry from '@sentry/node';

// Initialise Sentry only when a DSN is provided
let sentryInitialised = false;
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  sentryInitialised = true;
}

/**
 * Return an ISO timestamp string for the current moment.
 * @returns {string}
 */
function timestamp() {
  return new Date().toISOString();
}

/**
 * Structured logger with info / warn / error methods.
 * Each method writes to stdout/stderr and, for errors, to Sentry when configured.
 */
const logger = {
  /**
   * Log an informational message.
   * @param {string} msg   - Human-readable message
   * @param {object} [meta] - Optional structured metadata (must not contain secrets)
   */
  info(msg, meta) {
    const entry = { level: 'info', ts: timestamp(), msg };
    if (meta !== undefined) entry.meta = meta;
    console.log(JSON.stringify(entry));
  },

  /**
   * Log a warning message.
   * @param {string} msg   - Human-readable message
   * @param {object} [meta] - Optional structured metadata (must not contain secrets)
   */
  warn(msg, meta) {
    const entry = { level: 'warn', ts: timestamp(), msg };
    if (meta !== undefined) entry.meta = meta;
    console.warn(JSON.stringify(entry));
  },

  /**
   * Log an error message and, if Sentry is configured, capture the exception.
   * @param {string} msg         - Human-readable message
   * @param {Error|object} [meta] - Error instance or metadata (must not contain secrets)
   */
  error(msg, meta) {
    const entry = { level: 'error', ts: timestamp(), msg };
    if (meta !== undefined) entry.meta = meta instanceof Error ? meta.message : meta;
    console.error(JSON.stringify(entry));

    if (sentryInitialised && meta instanceof Error) {
      Sentry.captureException(meta);
    }
  },
};

export default logger;
