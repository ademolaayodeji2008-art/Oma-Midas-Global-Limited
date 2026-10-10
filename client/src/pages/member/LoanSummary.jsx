/**
 * LoanSummary.jsx — Member view of their own loan history and summary.
 * Shows total collected, repaid, and outstanding balance across all loans.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageTransition from '../../components/layout/PageTransition';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import api from '../../lib/api';

const fmt = (kobo) =>
  '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const statusVariant = {
  PENDING: 'neutral',
  APPROVED: 'info',
  REJECTED: 'error',
  DISBURSED: 'info',
  REPAYING: 'warning',
  COMPLETED: 'success',
  FAILED: 'error',
};

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function LoanSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/loans/summary')
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const summary = data?.summary || { totalCollectedKobo: 0, totalRepaidKobo: 0, outstandingKobo: 0 };
  const loans = data?.loans || [];

  return (
    <PageTransition>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">My Loan Summary</h1>
            <p className="text-sm text-gray-500 mt-1">Overview of all your cooperative loans</p>
          </div>

          {/* Summary cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <motion.div variants={itemVariants}>
              <Card className="p-5 border-l-4 border-primary">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Loan Collected</p>
                <p className="font-heading text-2xl font-bold text-primary">
                  {loading ? (
                    <span className="inline-block h-7 w-32 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    <AnimatedCounter
                      value={summary.totalCollectedKobo / 100}
                      prefix="₦"
                      formatter={(v) => v.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    />
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">Total disbursed to your account</p>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="p-5 border-l-4 border-success">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount Repaid</p>
                <p className="font-heading text-2xl font-bold text-success">
                  {loading ? (
                    <span className="inline-block h-7 w-32 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    <AnimatedCounter
                      value={summary.totalRepaidKobo / 100}
                      prefix="₦"
                      formatter={(v) => v.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    />
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">Total installments paid</p>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="p-5 border-l-4 border-warning">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Outstanding Balance</p>
                <p className={`font-heading text-2xl font-bold ${summary.outstandingKobo > 0 ? 'text-warning' : 'text-success'}`}>
                  {loading ? (
                    <span className="inline-block h-7 w-32 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    <AnimatedCounter
                      value={summary.outstandingKobo / 100}
                      prefix="₦"
                      formatter={(v) => v.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    />
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {summary.outstandingKobo > 0 ? 'Remaining to repay' : 'No outstanding balance'}
                </p>
              </Card>
            </motion.div>
          </motion.div>

          {/* Loan history table */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-heading text-lg font-semibold text-primary">Loan History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sectionBg/60">
                  <tr>
                    {['Cycle', 'Date', 'Status', 'Loan Amount', 'Disbursed (70%)', 'Total Repayable', 'Repaid', 'Outstanding'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : loans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-3xl">💼</span>
                          <p>No loans yet.</p>
                          <p className="text-xs">Your loan history will appear here once you take a loan.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    loans.map((loan, idx) => (
                      <motion.tr
                        key={loan.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-t border-gray-100 hover:bg-sectionBg/40 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {loan.cycleStart ? (
                            <>
                              {fmtDate(loan.cycleStart)}<br />
                              <span className="text-gray-400">to {fmtDate(loan.cycleEnd)}</span>
                            </>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(loan.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant[loan.status] || 'neutral'}>{loan.status}</Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-charcoal whitespace-nowrap">{fmt(loan.requestedAmountKobo)}</td>
                        <td className="px-4 py-3 font-mono text-charcoal whitespace-nowrap">{fmt(loan.disbursedAmountKobo)}</td>
                        <td className="px-4 py-3 font-mono text-charcoal whitespace-nowrap">{fmt(loan.totalRepayableKobo)}</td>
                        <td className="px-4 py-3 font-mono text-success whitespace-nowrap">{fmt(loan.repaidKobo)}</td>
                        <td className="px-4 py-3 font-mono whitespace-nowrap">
                          <span className={loan.outstandingKobo > 0 ? 'text-warning font-semibold' : 'text-success'}>
                            {fmt(loan.outstandingKobo)}
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </AppLayout>
    </PageTransition>
  );
}
