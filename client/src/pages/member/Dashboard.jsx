/**
 * Dashboard.jsx — Member dashboard with animated stats, 12-month grid, and contributions.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Calendar } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import ProgressBar from '../../components/ui/ProgressBar';
import PageTransition from '../../components/layout/PageTransition';
import { SkeletonCard } from '../../components/ui/LoadingSkeleton';
import api from '../../lib/api';
import { useCycle } from '../../hooks/useCycle';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const statusVariant = {
  PAID: 'success',
  PENDING: 'neutral',
  MISSED: 'error',
  LATE: 'warning',
};

function MonthDot({ status, month }) {
  const colors = {
    PAID: 'bg-success',
    PENDING: 'bg-gray-200',
    MISSED: 'bg-error',
    LATE: 'bg-warning',
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={['w-4 h-4 rounded-full', colors[status] || 'bg-gray-200'].join(' ')}
        title={`${month}: ${status}`}
        aria-label={`${month}: ${status}`}
      />
      <span className="text-[9px] text-gray-400">{month}</span>
    </div>
  );
}

export default function MemberDashboard() {
  const [stats, setStats] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cycle } = useCycle();

  useEffect(() => {
    Promise.all([
      api.get('/api/contributions'),
      api.get('/api/loans'),
    ])
      .then(([contribRes, loansRes]) => {
        const contribs = contribRes.data.contributions || contribRes.data || [];
        const loans = loansRes.data.loans || loansRes.data || [];
        setContributions(contribs);

        const savingsKobo = contribs
          .filter((c) => c.status === 'PAID')
          .reduce((sum, c) => sum + (c.amountKobo || 0), 0);

        const activeLoan = loans.find((l) =>
          l.status === 'APPROVED' || l.status === 'DISBURSED' || l.status === 'REPAYING'
        );
        setStats({ savingsKobo, activeLoan, contribs });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Build 12-slot grid for current cycle
  const grid = React.useMemo(() => {
    const slots = MONTHS.map((m) => ({ month: m, status: 'PENDING' }));
    contributions.forEach((c) => {
      const idx = c.month ? c.month - 1 : (c.dueDate ? new Date(c.dueDate).getMonth() : -1);
      if (idx >= 0 && idx < 12) {
        slots[idx].status = c.status || 'PENDING';
      }
    });
    return slots;
  }, [contributions]);

  const paidCount = grid.filter((g) => g.status === 'PAID').length;
  const thisMonthIdx = new Date().getMonth();
  const thisMonth = grid[thisMonthIdx];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <PageTransition>
      <AppLayout title="Dashboard">
        {loading ? (
          <div className="space-y-6">
            {/* Skeleton stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            {/* Skeleton month card and grid */}
            <SkeletonCard />
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-40 mb-4" />
              <div className="flex gap-3 flex-wrap">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            className="space-y-6"
            variants={prefersReducedMotion ? {} : containerVariants}
            initial={prefersReducedMotion ? 'visible' : 'hidden'}
            animate="visible"
          >
            {/* Stats row */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={prefersReducedMotion ? {} : containerVariants}
            >
              {/* Savings balance */}
              <motion.div variants={prefersReducedMotion ? {} : itemVariants}>
                <Card hover className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Wallet size={24} className="text-success" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Savings Balance</p>
                  <p className="font-heading text-2xl font-bold text-primary">
                    <AnimatedCounter value={Math.round((stats?.savingsKobo || 0) / 100)} prefix="₦" />
                  </p>
                  <ProgressBar value={Math.min(100, paidCount * (100 / 12))} label={`${paidCount}/12 months paid`} className="mt-3" />
                </Card>
              </motion.div>

              {/* Loan balance */}
              <motion.div variants={prefersReducedMotion ? {} : itemVariants}>
                <Card hover className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp size={24} className="text-error" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Active Loan</p>
                  {stats?.activeLoan ? (
                    <>
                      <p className="font-heading text-2xl font-bold text-error">
                        <AnimatedCounter value={Math.round((stats.activeLoan.requestedAmountKobo || 0) / 100)} prefix="₦" />
                      </p>
                      <Badge variant="warning" className="mt-2">{stats.activeLoan.status}</Badge>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">No active loan</p>
                  )}
                </Card>
              </motion.div>

              {/* Current cycle */}
              <motion.div variants={prefersReducedMotion ? {} : itemVariants}>
                <Card hover className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar size={24} className="text-primary" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Current Cycle</p>
                  {cycle ? (
                    <>
                      <p className="text-sm font-semibold text-charcoal">
                        {new Date(cycle.startDate).toLocaleDateString()} –
                        {new Date(cycle.endDate).toLocaleDateString()}
                      </p>
                      <Badge variant={cycle.isActive ? 'success' : 'neutral'} className="mt-2">
                        {cycle.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">No active cycle</p>
                  )}
                </Card>
              </motion.div>
            </motion.div>

            {/* This month's status */}
            <motion.div variants={prefersReducedMotion ? {} : itemVariants}>
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-heading font-bold text-primary">This Month</h2>
                  <Badge variant={statusVariant[thisMonth?.status] || 'neutral'}>
                    {thisMonth?.status || 'PENDING'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {MONTHS[thisMonthIdx]} — your contribution status for this month.
                </p>
              </Card>
            </motion.div>

            {/* 12-month grid */}
            <motion.div variants={prefersReducedMotion ? {} : itemVariants}>
              <Card>
                <h2 className="font-heading font-bold text-primary mb-4">12-Month Contributions</h2>
                <div className="flex gap-3 flex-wrap">
                  {grid.map((g) => (
                    <MonthDot key={g.month} month={g.month} status={g.status} />
                  ))}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-success inline-block" /> Paid</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" /> Pending</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-error inline-block" /> Missed</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" /> Late</span>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AppLayout>
    </PageTransition>
  );
}
