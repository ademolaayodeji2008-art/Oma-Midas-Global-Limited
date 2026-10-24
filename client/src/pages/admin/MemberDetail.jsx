/**
 * MemberDetail.jsx — Enhanced member detail page with financial summary and transaction history.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [member, setMember] = useState(null);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [transactionsPage, setTransactionsPage] = useState(1);

  const [loadingMember, setLoadingMember] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Fetch member profile
  useEffect(() => {
    setLoadingMember(true);
    api.get(`/api/admin/members/${id}`)
      .then((res) => setMember(res.data.member))
      .catch((err) => {
        toast({ message: err.response?.data?.error || 'Failed to load member', type: 'error' });
        navigate('/admin/members');
      })
      .finally(() => setLoadingMember(false));
  }, [id, navigate, toast]);

  // Fetch financial summary
  useEffect(() => {
    setLoadingSummary(true);
    api.get(`/api/admin/members/${id}/summary`)
      .then((res) => setSummary(res.data))
      .catch(() => {})
      .finally(() => setLoadingSummary(false));
  }, [id]);

  // Fetch transaction history
  useEffect(() => {
    setLoadingTransactions(true);
    api.get(`/api/admin/members/${id}/transactions`, { params: { page: transactionsPage, limit: 20 } })
      .then((res) => {
        setTransactions(res.data.transactions || []);
        setTransactionsTotal(res.data.pagination?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoadingTransactions(false));
  }, [id, transactionsPage]);

  if (loadingMember) {
    return (
      <PageTransition>
        <AppLayout title="Member Detail">
          <div className="flex justify-center py-16">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </AppLayout>
      </PageTransition>
    );
  }

  const statusVariant = {
    ACTIVE: 'success',
    PENDING: 'warning',
    REJECTED: 'error',
    INACTIVE: 'neutral',
  };

  const typeVariant = {
    CONTRIBUTION: 'info',
    LOAN_DISBURSEMENT: 'warning',
    LOAN_REPAYMENT: 'success',
    LOAN_FEE: 'neutral',
    REFUND: 'neutral',
    FUND_TOPUP: 'info',
  };

  const statCards = summary
    ? [
        { label: 'Total Savings', value: Math.round(summary.totalSavingsKobo / 100), prefix: '₦' },
        { label: 'Loans Collected', value: Math.round(summary.totalLoansCollectedKobo / 100), prefix: '₦' },
        { label: 'Loans Repaid', value: Math.round(summary.totalLoansRepaidKobo / 100), prefix: '₦' },
        { label: 'Outstanding Balance', value: Math.round(summary.outstandingBalanceKobo / 100), prefix: '₦' },
      ]
    : [];

  const transactionColumns = [
    { key: 'createdAt', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
    { key: 'type', label: 'Type', render: (v) => <Badge variant={typeVariant[v] || 'neutral'}>{v?.replace(/_/g, ' ')}</Badge> },
    { key: 'amountKobo', label: 'Amount', render: (v) => `₦${((v || 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}` },
    { key: 'balanceAfterKobo', label: 'Balance After', render: (v) => `₦${((v || 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}` },
    { key: 'reference', label: 'Reference', render: (v) => <span className="font-mono text-xs">{v || '—'}</span> },
  ];

  return (
    <PageTransition>
      <AppLayout title="Member Detail">
        <div className="space-y-6">
          {/* Header with back button and clearance card button */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Button variant="ghost" onClick={() => navigate('/admin/members')}>
              ← Back to Members
            </Button>
            <Button variant="primary" onClick={() => navigate(`/admin/members/${id}/clearance-card`)}>
              Download Clearance Card
            </Button>
          </div>

          {/* Profile card */}
          <Card>
            <h2 className="font-heading font-bold text-primary text-xl mb-4">Member Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Full Name</p>
                <p className="font-medium text-charcoal">{member?.fullName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</p>
                <p className="font-medium text-charcoal">{member?.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Phone</p>
                <p className="font-medium text-charcoal">{member?.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
                <Badge variant={statusVariant[member?.status] || 'neutral'}>{member?.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Member Type</p>
                <Badge variant="info">{member?.memberType}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Bank Name</p>
                <p className="font-medium text-charcoal">{member?.bankName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Account Number</p>
                <p className="font-medium text-charcoal font-mono">{member?.accountNumber || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Account Name</p>
                <p className="font-medium text-charcoal">{member?.accountName || '—'}</p>
              </div>
            </div>
          </Card>

          {/* Financial summary stats */}
          {loadingSummary ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              variants={prefersReducedMotion ? {} : containerVariants}
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate="visible"
            >
              {statCards.map((s, i) => (
                <motion.div key={i} variants={prefersReducedMotion ? {} : itemVariants}>
                  <Card>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
                    <p className="font-heading text-xl font-bold text-primary">
                      <AnimatedCounter value={s.value} prefix={s.prefix} />
                    </p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Transaction history */}
          <Card>
            <h2 className="font-heading font-bold text-primary text-xl mb-4">Transaction History</h2>
            <Table
              columns={transactionColumns}
              data={transactions}
              loading={loadingTransactions}
              emptyMessage="No transactions found."
            />
            {transactionsTotal > 20 && (
              <div className="mt-4">
                <Pagination
                  page={transactionsPage}
                  totalPages={Math.ceil(transactionsTotal / 20)}
                  onPageChange={setTransactionsPage}
                />
              </div>
            )}
          </Card>
        </div>
      </AppLayout>
    </PageTransition>
  );
}
