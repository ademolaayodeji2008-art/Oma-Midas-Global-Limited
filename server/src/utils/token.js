/**
 * token.js — JWT and password-reset token utilities
 */

import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sign a JWT with the given payload.
 * @param {object} payload   - Data to embed in the token
 * @param {string} secret    - Signing secret
 * @param {string} expiresIn - Token lifetime, e.g. '7d'
 * @returns {string} Signed JWT string
 */
export function generateToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verify and decode a JWT.
 * @param {string} token  - JWT string
 * @param {string} secret - Signing secret
 * @returns {object} Decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError} if invalid or expired
 */
export function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

/**
 * Generate a cryptographically random reset token (UUID v4).
 * Store the *hashed* version in the database — never the raw token.
 * @returns {string} Raw UUID v4 token (sent to the user via email)
 */
export function generateResetToken() {
  return uuidv4();
}

/**
 * Hash a reset token using SHA-256 for safe database storage.
 * Compare incoming tokens by hashing them before DB lookup.
 * @param {string} token - Raw reset token
 * @returns {string} SHA-256 hex digest
 */
export function hashResetToken(token) {
  return createHash('sha256').update(token).digest('hex');
}
