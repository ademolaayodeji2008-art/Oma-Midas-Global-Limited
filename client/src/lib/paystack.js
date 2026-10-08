/**
 * paystack.js — Utilities for loading and using the Paystack Inline payment JS.
 */

/** Dynamically loads the Paystack inline script if not already present. */
export function loadPaystack() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve(window.PaystackPop);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(window.PaystackPop);
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    document.head.appendChild(script);
  });
}

/**
 * Opens the Paystack checkout popup.
 * @param {object} opts
 * @param {string} opts.key        - Paystack public key
 * @param {string} opts.email      - Customer email
 * @param {number} opts.amountKobo - Amount in kobo
 * @param {string} opts.reference  - Unique transaction reference
 * @param {function} opts.onSuccess - Called with transaction when payment succeeds
 * @param {function} opts.onClose  - Called when popup is closed
 */
export async function openPaystackCheckout({ key, email, amountKobo, reference, onSuccess, onClose }) {
  const PaystackPop = await loadPaystack();

  const handler = PaystackPop.setup({
    key,
    email,
    amount: amountKobo,
    ref: reference,
    callback: onSuccess,
    onClose,
  });

  handler.openIframe();
}
