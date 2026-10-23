/**
 * BankAccountVerifier.jsx — Bank select + account number verification via Paystack.
 */

import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

/**
 * @param {object} props
 * @param {function} props.onVerified - Called with (bankName, accountNumber, accountName, bankCode)
 * @param {object} props.initialValues - { bankName, bankCode, accountNumber }
 */
export default function BankAccountVerifier({ onVerified, initialValues = {} }) {
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [bankCode, setBankCode] = useState(initialValues.bankCode || '');
  const [bankName, setBankName] = useState(initialValues.bankName || '');
  const [accountNumber, setAccountNumber] = useState(initialValues.accountNumber || '');
  const [accountName, setAccountName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/paystack/banks')
      .then((res) => setBanks(res.data.banks || res.data.data || []))
      .catch(() => setBanks([]))
      .finally(() => setBanksLoading(false));
  }, []);

  const handleBankChange = (e) => {
    const selected = banks.find((b) => b.code === e.target.value);
    setBankCode(e.target.value);
    setBankName(selected?.name || '');
    setAccountName('');
    setError('');
    // Always notify parent with current values so form state stays in sync
    if (onVerified) onVerified(selected?.name || '', accountNumber, '', e.target.value);
  };

  const verifyAccount = async () => {
    if (!bankCode || accountNumber.length < 10) return;
    setVerifying(true);
    setError('');
    setAccountName('');
    try {
      const res = await api.get('/api/paystack/resolve-account', {
        params: { accountNumber, bankCode },
      });
      const name = res.data.accountName || res.data.data?.account_name || '';
      setAccountName(name);
      if (onVerified) onVerified(bankName, accountNumber, name, bankCode);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not verify account. Check details and try again.';
      setError(msg);
      // Still pass the entered values to parent so form can submit
      if (onVerified) onVerified(bankName, accountNumber, '', bankCode);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Bank select */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">
          Bank Name <span aria-hidden="true" className="text-error">*</span>
        </label>
        <select
          value={bankCode}
          onChange={handleBankChange}
          disabled={banksLoading}
          required
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
          aria-label="Select bank"
        >
          <option value="">{banksLoading ? 'Loading banks…' : 'Select your bank'}</option>
          {banks.map((bank) => (
            <option key={bank.code} value={bank.code}>{bank.name}</option>
          ))}
        </select>
      </div>

      {/* Account number */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">
          Account Number <span aria-hidden="true" className="text-error">*</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={10}
          value={accountNumber}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setAccountNumber(val);
            setAccountName('');
            setError('');
            // Keep parent in sync as user types
            if (onVerified) onVerified(bankName, val, '', bankCode);
          }}
          onBlur={verifyAccount}
          placeholder="10-digit account number"
          required
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Account number"
          aria-describedby={error ? 'bank-error' : accountName ? 'account-name-display' : undefined}
        />
      </div>

      {/* Verification state */}
      {verifying && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" aria-hidden="true" />
          Verifying account…
        </div>
      )}

      {accountName && !verifying && (
        <div
          id="account-name-display"
          className="flex items-center gap-2 text-sm text-success bg-green-50 border border-green-200 rounded-xl px-3 py-2"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">✓</span>
          <strong>{accountName}</strong>
        </div>
      )}

      {error && !verifying && (
        <p id="bank-error" className="text-sm text-error" role="alert">{error}</p>
      )}
    </div>
  );
}
