/**
 * validate.middleware.js — Zod schema validation middleware factory.
 * Returns 422 on validation failure with structured field errors.
 */

import { ZodError } from 'zod';

/**
 * Create a validation middleware for the given Zod schema.
 * On success sets req.validated to the parsed + coerced body.
 * On failure returns HTTP 422 with {error, details}.
 *
 * @param {import('zod').ZodSchema} schema
 * @returns {import('express').RequestHandler}
 */
export function validate(schema) {
  return async function validationMiddleware(req, res, next) {
    try {
      req.validated = await schema.parseAsync(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(422).json({
          error: 'Validation failed',
          details: err.flatten().fieldErrors,
        });
      }
      next(err);
    }
  };
}
