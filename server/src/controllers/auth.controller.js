/**
 * auth.controller.js — Authentication and user profile endpoints.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken, generateResetToken, hashResetToken } from '../utils/token.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { createNotification } from '../services/notification.service.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------
export async function register(req, res, next) {
  try {
    const { fullName, email, phone, password, bankName, accountNumber, accountName } = req.validated;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash,
        bankName,
        accountNumber,
        accountName,
        status: 'PENDING',
        role: 'MEMBER',
      },
    });

    // Non-critical: send welcome email
    sendWelcomeEmail(user).catch((err) => logger.error('sendWelcomeEmail failed', err));

    return res.status(201).json({ message: 'Registration submitted, awaiting approval' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------
export async function login(req, res, next) {
  try {
    const { email, password } = req.validated;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({ error: 'Account pending approval', status: 'PENDING' });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        error: 'Application rejected',
        reason: user.rejectionReason,
        status: 'REJECTED',
      });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Account has been deactivated', status: 'INACTIVE' });
    }

    const token = generateToken(
      { id: user.id, role: user.role, status: user.status },
      process.env.JWT_SECRET,
      process.env.JWT_EXPIRES_IN || '7d'
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        memberType: user.memberType,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------
export function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  return res.json({ message: 'Logged out' });
}

// ---------------------------------------------------------------------------
// me
// ---------------------------------------------------------------------------
export function me(req, res) {
  const { passwordHash: _, ...safeUser } = req.user;
  return res.json({ user: safeUser });
}

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------
export async function updateProfile(req, res, next) {
  try {
    const { fullName, phone, bankName, accountNumber, accountName } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(bankName && { bankName }),
        ...(accountNumber && { accountNumber }),
        ...(accountName && { accountName }),
        // Reset Paystack recipient code if bank details changed
        ...(accountNumber && { paystackRecipientCode: null }),
      },
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
        updatedAt: true,
      },
    });

    return res.json({ user: updated });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// changePassword
// ---------------------------------------------------------------------------
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// forgotPassword
// ---------------------------------------------------------------------------
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.validated;

    // Always return the same message to prevent user enumeration
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const rawToken = generateResetToken();
      const hashedToken = hashResetToken(rawToken);
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: expires,
        },
      });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
      sendPasswordResetEmail(user, resetUrl).catch((err) =>
        logger.error('sendPasswordResetEmail failed', err)
      );
    }

    return res.json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// resetPassword
// ---------------------------------------------------------------------------
export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.validated;

    const hashedToken = hashResetToken(token);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}
