/**
 * kobo.js — Money utility helpers
 *
 * All monetary values in this application are stored as integers in kobo
 * (the smallest Nigerian currency unit: 1 naira = 100 kobo).
 * NEVER use floating-point arithmetic for money calculations.
 */

/**
 * Convert kobo integer to naira number (2 decimal places).
 * @param {number} kobo - Amount in kobo (integer)
 * @returns {number} Amount in naira rounded to 2 decimal places
 */
export function koboToNaira(kobo) {
  return Math.round((kobo / 100) * 100) / 100;
}

/**
 * Convert naira amount to kobo integer.
 * Uses Math.round to avoid floating-point drift (e.g. 1.005 * 100 = 100.5).
 * @param {number} naira - Amount in naira
 * @returns {number} Amount in kobo as a safe integer
 */
export function nairaToKobo(naira) {
  return Math.round(naira * 100);
}

/**
 * Format a kobo integer as a human-readable naira string.
 * @param {number} kobo - Amount in kobo (integer)
 * @returns {string} Formatted string, e.g. '₦1,234.56'
 */
export function formatNaira(kobo) {
  const naira = koboToNaira(kobo);
  return `₦${naira.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate the full loan fee breakdown using integer kobo math only.
 *
 * Business rules:
 *  - feeKobo             = round(requestedKobo × feePercentage / 100)
 *  - disbursedAmountKobo = requestedKobo − feeKobo   (what the member receives)
 *  - totalRepayableKobo  = requestedKobo              (member repays the full requested amount)
 *
 * @param {number} requestedKobo  - The loan amount requested by the member (integer kobo)
 * @param {number} feePercentage  - The fee rate, e.g. 30 for 30 %
 * @returns {{
 *   requestedAmountKobo: number,
 *   feeKobo: number,
 *   disbursedAmountKobo: number,
 *   totalRepayableKobo: number
 * }}
 */
export function calculateLoanBreakdown(requestedKobo, feePercentage) {
  const feeKobo = Math.round(requestedKobo * (feePercentage / 100));
  const disbursedAmountKobo = requestedKobo - feeKobo;
  const totalRepayableKobo = requestedKobo;

  return {
    requestedAmountKobo: requestedKobo,
    feeKobo,
    disbursedAmountKobo,
    totalRepayableKobo,
  };
}
