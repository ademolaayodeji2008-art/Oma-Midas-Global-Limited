/**
 * paystack.service.js — Paystack API client.
 *
 * All monetary amounts are in kobo (integer).
 * Paystack's API also uses kobo for Nigerian naira transactions.
 */

import axios from 'axios';

const paystackClient = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Extract and throw a descriptive error from a Paystack API response.
 * @param {import('axios').AxiosError} err
 */
function handlePaystackError(err) {
  const message =
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.message ||
    'Paystack request failed';
  const error = new Error(message);
  error.statusCode = err.response?.status || 500;
  throw error;
}

/**
 * Initialize a Paystack transaction.
 * @param {{email:string, amountKobo:number, reference:string, metadata?:object, callbackUrl?:string}} params
 * @returns {Promise<{authorization_url:string, access_code:string, reference:string}>}
 */
export async function initializeTransaction({ email, amountKobo, reference, metadata, callbackUrl }) {
  try {
    const body = {
      email,
      amount: amountKobo,
      reference,
      metadata,
      callback_url: callbackUrl,
    };
    const { data } = await paystackClient.post('/transaction/initialize', body);
    return data.data; // { authorization_url, access_code, reference }
  } catch (err) {
    handlePaystackError(err);
  }
}

/**
 * Verify a Paystack transaction by reference.
 * @param {string} reference
 * @returns {Promise<object>} Full transaction data object
 */
export async function verifyTransaction(reference) {
  try {
    const { data } = await paystackClient.get(`/transaction/verify/${reference}`);
    return data.data;
  } catch (err) {
    handlePaystackError(err);
  }
}

/**
 * Resolve a bank account number to get the account holder name.
 * @param {{accountNumber:string, bankCode:string}} params
 * @returns {Promise<{account_name:string}>}
 */
export async function resolveAccountNumber({ accountNumber, bankCode }) {
  try {
    const { data } = await paystackClient.get('/bank/resolve', {
      params: { account_number: accountNumber, bank_code: bankCode },
    });
    return data.data; // { account_name, account_number, bank_id }
  } catch (err) {
    handlePaystackError(err);
  }
}

/**
 * List all supported Nigerian banks.
 * @returns {Promise<Array<{name:string, code:string}>>}
 */
export async function listBanks() {
  try {
    const { data } = await paystackClient.get('/bank', {
      params: { country: 'nigeria', perPage: 100 },
    });
    return data.data;
  } catch (err) {
    handlePaystackError(err);
  }
}

/**
 * Create a Paystack transfer recipient.
 * @param {{name:string, accountNumber:string, bankCode:string}} params
 * @returns {Promise<{recipient_code:string}>}
 */
export async function createTransferRecipient({ name, accountNumber, bankCode }) {
  try {
    const body = {
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
    };
    const { data } = await paystackClient.post('/transferrecipient', body);
    return data.data; // { recipient_code, ... }
  } catch (err) {
    handlePaystackError(err);
  }
}

/**
 * Initiate a Paystack transfer.
 * @param {{amountKobo:number, recipientCode:string, reason:string, reference:string}} params
 * @returns {Promise<{transfer_code:string, status:string}>}
 */
export async function initiateTransfer({ amountKobo, recipientCode, reason, reference }) {
  try {
    const body = {
      source: 'balance',
      amount: amountKobo,
      recipient: recipientCode,
      reason,
      reference,
    };
    const { data } = await paystackClient.post('/transfer', body);
    return data.data; // { transfer_code, status, ... }
  } catch (err) {
    handlePaystackError(err);
  }
}

/**
 * Fetch the details of an existing transfer.
 * @param {string} transferCode
 * @returns {Promise<object>} Full transfer object
 */
export async function fetchTransfer(transferCode) {
  try {
    const { data } = await paystackClient.get(`/transfer/${transferCode}`);
    return data.data;
  } catch (err) {
    handlePaystackError(err);
  }
}

/**
 * Get the current Paystack balance.
 * @returns {Promise<{currency:string, balance:number}>} balance is in kobo
 */
export async function getBalance() {
  try {
    const { data } = await paystackClient.get('/balance');
    // Paystack returns an array; find the NGN entry
    const ngn = Array.isArray(data.data)
      ? data.data.find((b) => b.currency === 'NGN')
      : data.data;
    return { currency: 'NGN', balance: ngn?.balance ?? 0 };
  } catch (err) {
    handlePaystackError(err);
  }
}
