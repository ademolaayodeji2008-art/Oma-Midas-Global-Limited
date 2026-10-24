/**
 * Dashboard.jsx — Admin dashboard with stats, bar chart, and donut chart.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Coins, Receipt, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Simple SVG bar chart */
function BarChart({ data, height = 120 }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-400">No data</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.max(8, 200 / data.length);

  return (
    <div className="overflow-x-auto">
      <svg width={data.length * (barW + 6)} height={height + 24} aria-label="Monthly contributions bar chart" role="img">
        <title>Monthly Contributions</title>
        {data.map((d, i) => {
          const barH = Math.round((d.value / max) * height);
          const x = i * (barW + 6);
          return (
            <g key={i}>
              <rect x={x} y={height - barH} width={barW} height={barH} rx={4} fill="#C9A86A" aria-label={`${d.label}: ₦${(d.value / 100).toLocaleString()}`} />
              <text x={x + barW / 2} y={height + 14} textAnchor="middle" fontSize="9" fill="#999">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Simple SVG donut chart */
function DonutChart({ data }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-400">No data</p>;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const colors = ['#4A1D4F', '#C9A86A', '#2E7D5B', '#D9962B', '#B3392F'];
  let offset = 0;
  const r = 48;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-4">
      <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Loan status donut chart" role="img">
        <title>Loans by Status</title>
        {data.map((d, i) => {
          const pct = d.value / total;
          const stroke = pct * circumference;
          const dash = `${stroke} ${circumference - stroke}`;
          const dashOffset = circumference - offset * circumference;
          offset += pct;
          return (
            <circle
              key={i}
              cx="60" cy="60" r={r}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="18"
              strokeDasharray={dash}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
              aria-label={`${d.label}: ${d.value}`}
            />
          );
        })}
        <text x="60" y="64" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#4A1D4F">{total}</text>
      </svg>
      <ul className="text-xs space-y-1">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colors[i % colors.length] }} />
            {d.label}: <strong>{d.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/dashboard')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        { label: 'Total Members', value: stats.members?.total || 0, prefix: '', icon: Users, color: 'text-primary' },
        { label: 'Pending Approvals', value: stats.members?.pending || 0, prefix: '', icon: AlertCircle, color: 'text-warning' },
        { label: 'Active Members', value: stats.members?.active || 0, prefix: '', icon: CheckCircle, color: 'text-success' },
        { label: 'Pending Payments', value: stats.contributions?.pending || 0, prefix: '', icon: Receipt, color: 'text-warning' },
        { label: 'Total Savings (₦)', value: Math.round((stats.totalContributionsKobo || 0) / 100), prefix: '₦', icon: TrendingUp, color: 'text-success' },
        { label: 'Company Fund (₦)', value: Math.round((stats.companyFundBalanceKobo || 0) / 100), prefix: '₦', icon: Coins, color: 'text-accent' },
        { label: 'Repayments Received (₦)', value: Math.round((stats.totalRepaymentsKobo || 0) / 100), prefix: '₦', icon: DollarSign, color: 'text-success' },
        { label: 'Pending Repayments', value: stats.repayments?.pending || 0, prefix: '', icon: AlertCircle, color: 'text-warning' },
      ]
    : [];

  const monthlyData = (stats?.monthlyContributions || []).map((m, i) => ({
    label: MONTHS[m.month - 1] || `M${m.month}`,
    value: m.totalKobo || 0,
  }));

  const loanStatusData = Object.entries(stats?.loansByStatus || {}).map(([label, value]) => ({
    label,
    value,
  }));

  return (
    <PageTransition>
      <AppLayout title="Admin Dashboard">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stat cards */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              variants={prefersReducedMotion ? {} : containerVariants}
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate="visible"
            >
              {statCards.map((s, i) => (
                <motion.div key={i} variants={prefersReducedMotion ? {} : itemVariants}>
                  <Card hover>
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
                      <s.icon size={20} className={s.color} aria-hidden="true" />
                    </div>
                    <p className="font-heading text-2xl font-bold text-primary">
                      <AnimatedCounter value={s.value} prefix={s.prefix} />
                    </p>
                    {s.label === 'Pending Approvals' && s.value > 0 && (
                      <Badge variant="warning" className="mt-2">{s.value} pending</Badge>
                    )}
                    {s.label === 'Pending Payments' && s.value > 0 && (
                      <Badge variant="warning" className="mt-2">{s.value} awaiting</Badge>
                    )}
                    {s.label === 'Pending Repayments' && s.value > 0 && (
                      <Badge variant="warning" className="mt-2">{s.value} awaiting</Badge>
                    )}
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h2 className="font-heading font-bold text-primary mb-4">Monthly Contributions</h2>
                <BarChart data={monthlyData} />
              </Card>
              <Card>
                <h2 className="font-heading font-bold text-primary mb-4">Loans by Status</h2>
                <DonutChart data={loanStatusData} />
              </Card>
            </div>
          </div>
        )}
      </AppLayout>
    </PageTransition>
  );
}
