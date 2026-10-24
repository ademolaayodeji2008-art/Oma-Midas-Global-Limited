/**
 * BankAccountVerifier.jsx — Simple bank input form (no Paystack verification).
 * Members manually enter bank details.
 */

import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

/**
 * @param {object} props
 * @param {function} props.onVerified - Called with (bankName, accountNumber, accountName, bankCode)
 * @param {object} props.initialValues - { bankName, bankCode, accountNumber, accountName }
 */
export default function BankAccountVerifier({ onVerified, initialValues = {} }) {
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [bankCode, setBankCode] = useState(initialValues.bankCode || '');
  const [bankName, setBankName] = useState(initialValues.bankName || '');
  const [accountNumber, setAccountNumber] = useState(initialValues.accountNumber || '');
  const [accountName, setAccountName] = useState(initialValues.accountName || '');

  useEffect(() => {
    // Load banks list (no authentication required)
    api.get('/api/paystack/banks')
      .then((res) => setBanks(res.data.banks || res.data.data || []))
      .catch(() => setBanks([]))
      .finally(() => setBanksLoading(false));
  }, []);

  const handleBankChange = (e) => {
    const selected = banks.find((b) => b.code === e.target.value);
    const newBankCode = e.target.value;
    const newBankName = selected?.name || '';
    
    setBankCode(newBankCode);
    setBankName(newBankName);
    
    // Notify parent with updated values
    if (onVerified) onVerified(newBankName, accountNumber, accountName, newBankCode);
  };

  const handleAccountNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setAccountNumber(val);
    // Notify parent
    if (onVerified) onVerified(bankName, val, accountName, bankCode);
  };

  const handleAccountNameChange = (e) => {
    const val = e.target.value;
    setAccountName(val);
    // Notify parent
    if (onVerified) onVerified(bankName, accountNumber, val, bankCode);
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
          onChange={handleAccountNumberChange}
          placeholder="10-digit account number"
          required
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Account number"
        />
      </div>

      {/* Account name */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1">
          Account Name <span aria-hidden="true" className="text-error">*</span>
        </label>
        <input
          type="text"
          value={accountName}
          onChange={handleAccountNameChange}
          placeholder="e.g. John Doe"
          required
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Account name"
        />
        <p className="text-xs text-gray-400 mt-1">Enter your name as it appears on your bank account</p>
      </div>
    </div>
  );
}
