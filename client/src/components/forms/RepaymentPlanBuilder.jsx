/**
 * RepaymentPlanBuilder.jsx — Dynamic repayment schedule form.
 * Validates: sum === totalRepayableKobo, all dates <= cycleEndDate, no duplicates.
 */

import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';

/**
 * @param {object} props
 * @param {number} props.totalRepayableKobo
 * @param {string} props.cycleEndDate - ISO date string
 * @param {function} props.onChange - Called with schedule array [{dueDate, amountKobo}]
 */
export default function RepaymentPlanBuilder({ totalRepayableKobo = 0, cycleEndDate, onChange }) {
  const [months, setMonths] = useState(1);
  const [rows, setRows] = useState([{ dueDate: '', amountNaira: '' }]);
  const [errors, setErrors] = useState([]);

  // Reset rows when months count changes
  useEffect(() => {
    setRows(
      Array.from({ length: months }, (_, i) => rows[i] || { dueDate: '', amountNaira: '' })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months]);

  const updateRow = (index, field, value) => {
    const updated = rows.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    setRows(updated);
    validate(updated);
  };

  const validate = (currentRows) => {
    const errs = [];
    const totalKobo = currentRows.reduce((sum, r) => {
      return sum + Math.round(parseFloat(r.amountNaira || '0') * 100);
    }, 0);

    // Sum check
    if (totalKobo !== totalRepayableKobo && totalRepayableKobo > 0) {
      errs.push(
        `Total repayment (₦${(totalKobo / 100).toLocaleString()}) must equal ₦${(totalRepayableKobo / 100).toLocaleString()}.`
      );
    }

    // Date checks
    const dates = currentRows.map((r) => r.dueDate).filter(Boolean);
    const uniqueDates = new Set(dates);
    if (uniqueDates.size !== dates.length) errs.push('Duplicate dates found.');

    if (cycleEndDate) {
      const endMs = new Date(cycleEndDate).getTime();
      currentRows.forEach((r, i) => {
        if (r.dueDate && new Date(r.dueDate).getTime() > endMs) {
          errs.push(`Row ${i + 1}: date must be on or before ${new Date(cycleEndDate).toLocaleDateString()}.`);
        }
      });
    }

    setErrors(errs);

    if (errs.length === 0 && onChange) {
      onChange(
        currentRows.map((r) => ({
          dueDate: r.dueDate,
          amountKobo: Math.round(parseFloat(r.amountNaira || '0') * 100),
        }))
      );
    }
  };

  const totalEntered = rows.reduce(
    (sum, r) => sum + Math.round(parseFloat(r.amountNaira || '0') * 100),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="repayment-months" className="text-sm font-medium text-charcoal">
          Number of instalments
        </label>
        <select
          id="repayment-months"
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-3 items-center">
            <span className="text-xs text-gray-400 w-6 text-right">{i + 1}.</span>
            <input
              type="date"
              value={row.dueDate}
              max={cycleEndDate ? cycleEndDate.split('T')[0] : undefined}
              onChange={(e) => updateRow(i, 'dueDate', e.target.value)}
              aria-label={`Instalment ${i + 1} due date`}
              required
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="number"
              min="0"
              step="100"
              value={row.amountNaira}
              onChange={(e) => updateRow(i, 'amountNaira', e.target.value)}
              placeholder="Amount (₦)"
              aria-label={`Instalment ${i + 1} amount`}
              required
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        ))}
      </div>

      {/* Running total */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Total entered</span>
        <span className={totalEntered === totalRepayableKobo && totalRepayableKobo > 0 ? 'text-success font-semibold' : 'text-charcoal'}>
          ₦{(totalEntered / 100).toLocaleString()} / ₦{(totalRepayableKobo / 100).toLocaleString()}
        </span>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <ul className="space-y-1">
          {errors.map((err, i) => (
            <li key={i} className="text-xs text-error" role="alert">{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
