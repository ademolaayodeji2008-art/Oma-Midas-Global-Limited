/**
 * ClearanceCard.jsx — Monthly Clearance Card for members.
 * Fetches GET /api/clearance-card and renders a printable premium card.
 */

import React, { useEffect, useState } from 'react';
import { WalletCards } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';

/** Format kobo integer as Nigerian naira string, e.g. ₦12,500.00 */
function formatNaira(kobo) {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function StatusBadge({ status }) {
  const map = {
    GOOD_STANDING: { variant: 'success', label: 'Good Standing' },
    CAUTION:       { variant: 'warning', label: 'Caution' },
    SUSPENDED:     { variant: 'error',   label: 'Suspended' },
  };
  const { variant, label } = map[status] || { variant: 'neutral', label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

export default function ClearanceCard() {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/clearance-card')
      .then((res) => setCard(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load clearance card.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageTransition>
      <AppLayout title="Clearance Card">
        {/* Print style — hides layout chrome and print button */}
        <style>{`
          @media print {
            header, aside, nav, .mobile-menu, .print-hide { display: none !important; }
            body { background: white; }
          }
        `}</style>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {error && (
          <Card className="max-w-lg mx-auto text-center py-10">
            <p className="text-red-500 font-medium">{error}</p>
          </Card>
        )}

        {card && (
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Card header */}
            <div className="bg-[#1E1433] rounded-2xl px-6 py-5 flex items-center gap-4 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-[#C9A86A] flex items-center justify-center flex-shrink-0">
                <WalletCards size={28} className="text-[#1E1433]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-[#C9A86A] text-lg leading-tight">
                  OMA MIDAS GLOBAL LIMITED
                </h2>
                <p className="text-[#F5F0FF]/70 text-sm tracking-widest uppercase">Clearance Card</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[#F5F0FF]/50 text-xs">Issued</p>
                <p className="text-[#F5F0FF] text-sm font-semibold">
                  {new Date(card.issuedDate).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Member info */}
            <Card>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Member No.</p>
                  <p className="font-mono font-bold text-primary text-sm">{card.memberNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Full Name</p>
                  <p className="font-semibold text-charcoal text-sm">{card.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Member Type</p>
                  <Badge variant="info">{card.memberType}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Status</p>
                  <StatusBadge status={card.membershipStatus} />
                </div>
              </div>
            </Card>

            {/* Cycle info */}
            <Card>
              <p className="text-xs text-gray-400 mb-1">Active Cycle</p>
              <p className="font-semibold text-charcoal">
                {new Date(card.cycle.startDate).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' — '}
                {new Date(card.cycle.endDate).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </Card>

            {/* Savings board */}
            <Card>
              <h3 className="font-heading font-bold text-primary mb-3">Savings Board</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pb-2 text-xs text-gray-400 font-medium">Month</th>
                      <th className="text-left pb-2 text-xs text-gray-400 font-medium">Date Paid</th>
                      <th className="text-right pb-2 text-xs text-gray-400 font-medium">Amount</th>
                      <th className="text-right pb-2 text-xs text-gray-400 font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {card.savingsBoard.map((row) => (
                      <tr
                        key={row.month}
                        className={[
                          'border-b border-gray-50',
                          row.amountKobo > 0 ? 'bg-green-50/60' : '',
                        ].join(' ')}
                      >
                        <td className="py-2 font-medium text-charcoal">{MONTH_NAMES[row.month - 1]}</td>
                        <td className="py-2 text-gray-500">
                          {row.date ? new Date(row.date).toLocaleDateString('en-NG') : '—'}
                        </td>
                        <td className="py-2 text-right font-mono">
                          {row.amountKobo > 0 ? formatNaira(row.amountKobo) : '—'}
                        </td>
                        <td className="py-2 text-right font-mono text-primary font-semibold">
                          {row.balanceKobo > 0 ? formatNaira(row.balanceKobo) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Loan board */}
            <Card>
              <h3 className="font-heading font-bold text-primary mb-3">Loan Repayment Board</h3>
              {card.loanBoard.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No loan this cycle.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left pb-2 text-xs text-gray-400 font-medium">Month</th>
                        <th className="text-right pb-2 text-xs text-gray-400 font-medium">Repaid</th>
                        <th className="text-right pb-2 text-xs text-gray-400 font-medium">Cleared</th>
                        <th className="text-right pb-2 text-xs text-gray-400 font-medium">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {card.loanBoard.map((row, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 font-medium text-charcoal">{MONTH_NAMES[row.month - 1]}</td>
                          <td className="py-2 text-right font-mono">{formatNaira(row.refundKobo)}</td>
                          <td className="py-2 text-right font-mono text-green-600">{formatNaira(row.clearedKobo)}</td>
                          <td className="py-2 text-right font-mono text-orange-500">{formatNaira(row.outstandingKobo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Balance sheet */}
            <Card>
              <h3 className="font-heading font-bold text-primary mb-3">Balance Sheet</h3>
              <dl className="space-y-2">
                {[
                  { label: 'Total Saved',        value: formatNaira(card.balanceSheet.totalSavedKobo) },
                  { label: 'Total Loaned',        value: formatNaira(card.balanceSheet.totalLoanedKobo) },
                  { label: 'Total Deductions',    value: formatNaira(card.balanceSheet.totalDeductionsKobo) },
                  { label: 'Deduction Return',    value: formatNaira(card.balanceSheet.deductionReturnKobo) },
                  { label: `Dividend Rate`,       value: `${card.balanceSheet.dividendRate}%` },
                  { label: 'Dividend Amount',     value: formatNaira(card.balanceSheet.dividendAmountKobo) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 text-sm">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="font-mono font-medium text-charcoal">{value}</dd>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 text-sm font-bold">
                  <dt className="text-primary">Sum Total</dt>
                  <dd className="font-mono text-primary text-base">{formatNaira(card.balanceSheet.sumTotalKobo)}</dd>
                </div>
              </dl>
            </Card>

            {/* Membership status */}
            <Card>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Membership Status</p>
                  <StatusBadge status={card.membershipStatus} />
                </div>
                <p className="text-sm text-gray-500 ml-2">{card.membershipStatusNote}</p>
              </div>
            </Card>

            {/* Print button */}
            <div className="flex justify-end print-hide">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-[#C9A86A] text-[#1E1433] font-semibold text-sm hover:bg-[#b8945a] transition-colors"
              >
                Print / Download
              </button>
            </div>
          </div>
        )}
      </AppLayout>
    </PageTransition>
  );
}
