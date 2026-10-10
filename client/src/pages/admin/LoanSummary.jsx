/**
 * LoanSummary.jsx — Admin view: per-member loan summary table.
 * Shows each member's total loan collected, amount repaid, and outstanding balance.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import PageTransition from '../../components/layout/PageTransition';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import api from '../../lib/api';

const fmt = (kobo) =>
  '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });

const statusVariant = { REPAYING: 'warning', COMPLETED: 'success', DISBURSED: 'info', APPROVED: 'neutral', PENDING: 'neutral', REJECTED: 'error' };

export default function LoanSummary() {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ collected: 0, repaid: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/loans/summary', { params: { page, search } });
      const data = res.data;
      setRows(data.rows || []);
      setTotalPages(data.totalPages || 1);
      setTotals(data.totals || { collected: 0, repaid: 0, balance: 0 });
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <PageTransition>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">Loan Summary</h1>
            <p className="text-sm text-gray-500 mt-1">Per-member breakdown of loans collected, repaid, and outstanding balance</p>
          </div>

          {/* Summary cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <motion.div variants={itemVariants}>
              <Card className="p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Loans Collected</p>
                <p className="font-heading text-2xl font-bold text-primary">
                  <AnimatedCounter value={totals.collected / 100} prefix="₦" formatter={(v) => v.toLocaleString('en-NG', { minimumFractionDigits: 2 })} />
                </p>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Repaid</p>
                <p className="font-heading text-2xl font-bold text-success">
                  <AnimatedCounter value={totals.repaid / 100} prefix="₦" formatter={(v) => v.toLocaleString('en-NG', { minimumFractionDigits: 2 })} />
                </p>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Outstanding Balance</p>
                <p className="font-heading text-2xl font-bold text-warning">
                  <AnimatedCounter value={totals.balance / 100} prefix="₦" formatter={(v) => v.toLocaleString('en-NG', { minimumFractionDigits: 2 })} />
                </p>
              </Card>
            </motion.div>
          </motion.div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by member name or email…"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white text-sm rounded-xl hover:bg-primary/90 transition"
            >
              Search
            </button>
          </form>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sectionBg/60">
                  <tr>
                    {['Member', 'Email', 'Active Loan Status', 'Loan Collected', 'Amount Repaid', 'Outstanding Balance'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                        No loan records found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => (
                      <motion.tr
                        key={row.userId}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="border-t border-gray-100 hover:bg-sectionBg/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-charcoal whitespace-nowrap">{row.fullName}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.email}</td>
                        <td className="px-4 py-3">
                          {row.activeLoanStatus ? (
                            <Badge variant={statusVariant[row.activeLoanStatus] || 'neutral'}>
                              {row.activeLoanStatus}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">No active loan</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-charcoal whitespace-nowrap">{fmt(row.totalCollectedKobo)}</td>
                        <td className="px-4 py-3 font-mono text-success whitespace-nowrap">{fmt(row.totalRepaidKobo)}</td>
                        <td className="px-4 py-3 font-mono whitespace-nowrap">
                          <span className={row.outstandingKobo > 0 ? 'text-warning font-semibold' : 'text-success'}>
                            {fmt(row.outstandingKobo)}
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </AppLayout>
    </PageTransition>
  );
}
