/**
 * auth.middleware.js — JWT authentication via httpOnly cookie
 */

import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../utils/token.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Authenticate requests via JWT stored in the 'token' httpOnly cookie.
 * Attaches req.user (without passwordHash) on success.
 */
export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let payload;
    try {
      payload = verifyToken(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        memberType: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        paystackRecipientCode: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      return res.status(401).json({ error: 'User not found or account deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error('authenticate middleware error', err);
    next(err);
  }
}
