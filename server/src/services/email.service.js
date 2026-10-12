/**
 * email.service.js — Transactional email sender.
 *
 * All email sends are wrapped in try/catch — a failed email must never
 * cause a transaction to roll back or an API response to fail.
 * Failures are logged but not rethrown.
 *
 * Brand colors:
 *   Primary:  #4A1D4F  (deep purple header)
 *   Accent:   #C9A86A  (gold accents)
 */

import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

/** Lazily initialised transporter */
let _transporter = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return _transporter;
}

// ---------------------------------------------------------------------------
// HTML template helpers
// ---------------------------------------------------------------------------

function htmlWrapper(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background:#4A1D4F;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#C9A86A;font-size:22px;letter-spacing:1px;">Oma Midas Global Limited</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#4A1D4F;padding:16px 32px;text-align:center;">
              <p style="margin:0;color:#C9A86A;font-size:12px;">© ${new Date().getFullYear()} Oma Midas Global Limited. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heading(text) {
  return `<h2 style="color:#4A1D4F;margin-top:0;">${text}</h2>`;
}

function paragraph(text) {
  return `<p style="color:#333;line-height:1.6;">${text}</p>`;
}

function button(url, label) {
  return `<p style="text-align:center;margin:24px 0;">
    <a href="${url}" style="background:#4A1D4F;color:#C9A86A;text-decoration:none;padding:12px 28px;border-radius:4px;font-size:15px;display:inline-block;">${label}</a>
  </p>`;
}

function infoBox(rows) {
  const cells = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:8px 12px;font-weight:bold;color:#4A1D4F;white-space:nowrap;">${label}</td>
          <td style="padding:8px 12px;color:#333;">${value}</td>
        </tr>`
    )
    .join('');
  return `<table style="border-collapse:collapse;width:100%;border:1px solid #e0d4e8;border-radius:4px;margin:16px 0;">
    <tbody>${cells}</tbody>
  </table>`;
}

// ---------------------------------------------------------------------------
// Email send helper
// ---------------------------------------------------------------------------

async function send(to, subject, html) {
  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || 'Oma Midas <noreply@omamidas.com>',
      to,
      subject,
      html,
    });
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`, err);
  }
}

// ---------------------------------------------------------------------------
// Public email functions
// ---------------------------------------------------------------------------

/**
 * Send a welcome email to a newly registered member.
 * @param {{fullName:string, email:string}} user
 */
export async function sendWelcomeEmail(user) {
  const html = htmlWrapper(
    'Welcome to Oma Midas',
    heading('Welcome to Oma Midas Global Limited!') +
      paragraph(`Dear <strong>${user.fullName}</strong>,`) +
      paragraph(
        'Thank you for registering with Oma Midas Global Limited. Your application has been received and is currently under review by the cooperative administrator.'
      ) +
      paragraph(
        'You will receive an email notification once your account has been approved. We look forward to having you as a valued member of our cooperative.'
      ) +
      paragraph('If you have any questions, please contact the cooperative administrator.')
  );
  await send(user.email, 'Welcome to Oma Midas Global Limited', html);
}

/**
 * Send an account approval email.
 * @param {{fullName:string, email:string}} user
 */
export async function sendApprovalEmail(user) {
  const html = htmlWrapper(
    'Account Approved',
    heading('Your Account Has Been Approved!') +
      paragraph(`Dear <strong>${user.fullName}</strong>,`) +
      paragraph(
        'Great news! Your membership application has been reviewed and approved by the cooperative administrator.'
      ) +
      paragraph(
        'You can now log in to your account and start making your monthly contributions. You will become eligible for cooperative loans after meeting the minimum contribution requirements.'
      ) +
      button(process.env.FRONTEND_URL || '#', 'Log In Now')
  );
  await send(user.email, 'Your account has been approved — Oma Midas', html);
}

/**
 * Send an account rejection email.
 * @param {{fullName:string, email:string}} user
 * @param {string} reason
 */
export async function sendRejectionEmail(user, reason) {
  const html = htmlWrapper(
    'Application Update',
    heading('Application Update') +
      paragraph(`Dear <strong>${user.fullName}</strong>,`) +
      paragraph(
        'We regret to inform you that your membership application to Oma Midas Global Limited has not been approved at this time.'
      ) +
      infoBox([['Reason', reason || 'Not specified']]) +
      paragraph(
        'If you believe this decision was made in error or have additional information to provide, please contact the cooperative administrator directly.'
      )
  );
  await send(user.email, 'Application update — Oma Midas', html);
}

/**
 * Send a password reset email.
 * @param {{fullName:string, email:string}} user
 * @param {string} resetUrl
 */
export async function sendPasswordResetEmail(user, resetUrl) {
  const html = htmlWrapper(
    'Reset Your Password',
    heading('Password Reset Request') +
      paragraph(`Dear <strong>${user.fullName}</strong>,`) +
      paragraph(
        'We received a request to reset your password. Click the button below to create a new password. This link will expire in <strong>1 hour</strong>.'
      ) +
      button(resetUrl, 'Reset Password') +
      paragraph(
        'If you did not request a password reset, please ignore this email — your account is secure and your password has not been changed.'
      )
  );
  await send(user.email, 'Reset your password — Oma Midas', html);
}

/**
 * Send a monthly contribution reminder email.
 * @param {{fullName:string, email:string}} user
 * @param {number} month
 * @param {number} year
 */
export async function sendContributionReminderEmail(user, month, year) {
  const monthName = new Date(year, month - 1).toLocaleString('en-NG', { month: 'long' });
  const html = htmlWrapper(
    'Monthly Contribution Reminder',
    heading('Monthly Contribution Reminder') +
      paragraph(`Dear <strong>${user.fullName}</strong>,`) +
      paragraph(
        `This is a friendly reminder that your monthly contribution for <strong>${monthName} ${year}</strong> is due.`
      ) +
      paragraph(
        'Keeping up with your contributions ensures you remain eligible for cooperative loans and refunds.'
      ) +
      button(`${process.env.FRONTEND_URL || '#'}/member/contributions`, 'Make Contribution Now')
  );
  await send(user.email, `Monthly contribution reminder — ${monthName} ${year}`, html);
}

/**
 * Send a loan installment repayment reminder.
 * @param {{fullName:string, email:string}} user
 * @param {{dueDate:Date, amountKobo:number}} installment
 */
export async function sendLoanInstallmentReminderEmail(user, installment) {
  const dueDate = new Date(installment.dueDate).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const amountNaira = (installment.amountKobo / 100).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
  });
  const html = htmlWrapper(
    'Loan Repayment Reminder',
    heading('Loan Repayment Reminder') +
      paragraph(`Dear <strong>${user.fullName}</strong>,`) +
      paragraph(
        'This is a reminder that a loan installment repayment is due soon.'
      ) +
      infoBox([
        ['Due Date', dueDate],
        ['Amount Due', `₦${amountNaira}`],
      ]) +
      button(`${process.env.FRONTEND_URL || '#'}/member/loan-repayment`, 'Make Repayment Now')
  );
  await send(user.email, 'Loan repayment reminder — Oma Midas', html);
}

/**
 * Send a loan approval notification email.
 * @param {{fullName:string, email:string}} user
 * @param {{requestedAmountKobo:number, disbursedAmountKobo:number, repaymentMonths:number}} loan
 */
export async function sendLoanApprovalEmail(user, loan) {
  const requestedNaira = (loan.requestedAmountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  const disbursedNaira = (loan.disbursedAmountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  const html = htmlWrapper(
    'Loan Approved',
    heading('Your Loan Has Been Approved!') +
      paragraph(`Dear <strong>${user.fullName}</strong>,`) +
      paragraph(
        'We are pleased to inform you that your loan application has been approved and disbursement has been initiated.'
      ) +
      infoBox([
        ['Requested Amount', `₦${requestedNaira}`],
        ['Disbursed Amount', `₦${disbursedNaira}`],
        ['Repayment Period', `${loan.repaymentMonths} month(s)`],
      ]) +
      paragraph(
        'Please allow 1–3 business days for the funds to reflect in your bank account.'
      ) +
      button(`${process.env.FRONTEND_URL || '#'}/member/loan-repayment`, 'View Repayment Schedule')
  );
  await send(user.email, 'Loan approved — Oma Midas', html);
}

/**
 * Send a loan rejection notification email.
 * @param {{fullName:string, email:string}} user
 * @param {{rejectionReason:string}} loan
 */
export async function sendLoanRejectionEmail(user, loan) {
  const html = htmlWrapper(
    'Loan Application Update',
    heading('Loan Application Update') +
      paragraph(`Dear <strong>${user.fullName}</strong>,`) +
      paragraph(
        'We have reviewed your loan application and are unable to approve it at this time.'
      ) +
      infoBox([['Reason', loan.rejectionReason || 'Not specified']]) +
      paragraph(
        'You are welcome to apply again in the future once the conditions for approval are met. Please contact the cooperative administrator if you have questions.'
      )
  );
  await send(user.email, 'Loan application update — Oma Midas', html);
}

/**
 * Send a clearance card authorized email to a member.
 * @param {{fullName:string, email:string}} user
 */
export async function sendClearanceAuthorizedEmail(user) {
  const html = htmlWrapper(
    'Clearance Card Authorized',
    heading('Your Clearance Card Has Been Authorized!') +
      paragraph(`Dear <strong>${user.fullName}</strong>,`) +
      paragraph(
        'Great news! The cooperative administrator has authorized your clearance card. You can now view, print, and download your clearance card at any time.'
      ) +
      button(`${process.env.FRONTEND_URL || '#'}/member/clearance-card`, 'View Clearance Card') +
      paragraph(
        'If you have any questions, please contact the cooperative administrator.'
      )
  );
  await send(user.email, 'Clearance card authorized — Oma Midas', html);
}

/**
 * Send a clearance card request notification email to an admin.
 * @param {{fullName:string, email:string}} admin
 * @param {string} memberName
 */
export async function sendClearanceRequestEmail(admin, memberName) {
  const html = htmlWrapper(
    'New Clearance Card Request',
    heading('New Clearance Card Authorization Request') +
      paragraph(`Dear <strong>${admin.fullName}</strong>,`) +
      paragraph(
        `A member has requested clearance card authorization and is awaiting your review.`
      ) +
      infoBox([['Member Name', memberName]]) +
      button(`${process.env.FRONTEND_URL || '#'}/admin/members`, 'Review Request') +
      paragraph(
        'Log in to the admin panel and navigate to Members → Clearance Requests to authorize or deny the request.'
      )
  );
  await send(admin.email, 'New clearance card request — Oma Midas', html);
}

/**
 * Send a refund approval notification email.
 * @param {{fullName:string, email:string}} user
 * @param {{amountKobo:number}} refund
 */
export async function sendRefundApprovalEmail(user, refund) {
  const amountNaira = (refund.amountKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  const html = htmlWrapper(
    'Refund Approved',
    heading('Your Refund Has Been Approved!') +
      paragraph(`Dear <strong>${user.fullName}</strong>,`) +
      paragraph(
        'Your refund request has been approved and the transfer has been initiated to your registered bank account.'
      ) +
      infoBox([['Refund Amount', `₦${amountNaira}`]]) +
      paragraph(
        'Please allow 1–3 business days for the funds to reflect in your bank account.'
      )
  );
  await send(user.email, 'Refund approved — Oma Midas', html);
}
