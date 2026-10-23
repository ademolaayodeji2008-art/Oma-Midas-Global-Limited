/**
 * LoanCalculator.jsx — Interactive loan breakdown calculator.
 * Shows: amount requested, fee (10%), amount you receive (90%), total repayable.
 */

import React, { useState } from 'react';
import Card from '../ui/Card';

/**
 * @param {object} props
 * @param {number} props.feePercentage - Default 10
 * @param {function} props.onChange - Called with { amountKobo, feeKobo, netKobo, totalRepayableKobo }
 */
export default function LoanCalculator({ feePercentage = 10, onChange }) {
  const [amountNaira, setAmountNaira] = useState('');

  const amountKobo = Math.round(parseFloat(amountNaira || '0') * 100);
  const feeKobo = Math.round(amountKobo * (feePercentage / 100));
  const netKobo = amountKobo - feeKobo;
  const totalRepayableKobo = amountKobo; // repay the full amount requested

  const fmt = (kobo) =>
    (kobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });

  const handleChange = (e) => {
    const val = e.target.value;
    setAmountNaira(val);
    const kobo = Math.round(parseFloat(val || '0') * 100);
    const fee = Math.round(kobo * (feePercentage / 100));
    if (onChange) {
      onChange({
        amountKobo: kobo,
        feeKobo: fee,
        netKobo: kobo - fee,
        totalRepayableKobo: kobo,
      });
    }
  };

  return (
    <Card className="space-y-4">
      <h3 className="font-heading font-bold text-primary text-lg">Loan Calculator</h3>

      <div>
        <label htmlFor="loan-amount" className="block text-sm font-medium text-charcoal mb-1">
          Loan Amount (₦)
        </label>
        <input
          id="loan-amount"
          type="number"
          min="0"
          step="1000"
          value={amountNaira}
          onChange={handleChange}
          placeholder="e.g. 50000"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-describedby="loan-calc-breakdown"
        />
      </div>

      {amountKobo > 0 && (
        <div id="loan-calc-breakdown" className="space-y-2 border-t border-gray-100 pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount Requested</span>
            <span className="font-semibold text-charcoal">{fmt(amountKobo)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Company Fee ({feePercentage}%)</span>
            <span className="font-semibold text-error">{fmt(feeKobo)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount You Receive</span>
            <span className="font-semibold text-success">{fmt(netKobo)}</span>
          </div>
          <hr className="gold-divider" />
          <div className="flex justify-between text-sm font-bold">
            <span className="text-charcoal">Total Repayable</span>
            <span className="text-primary">{fmt(totalRepayableKobo)}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
