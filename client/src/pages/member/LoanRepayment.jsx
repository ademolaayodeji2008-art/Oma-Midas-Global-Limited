/**
 * LoanRepayment.jsx — Current loan and installment payment page (manual bank transfer flow).
 */

import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

const statusVariant = {
  PAID: 'success',
  PENDING_CONFIRMATION: 'warning',
  PENDING: 'neutral',
  OVERDUE: 'error',
};

const statusLabel = {
  PAID: 'Paid',
  PENDING_CONFIRMATION: 'Awaiting Confirmation',
  PENDING: 'Pending',
  OVERDUE: 'Overdue',
};

function fmt(kobo) {
  return `₦${((kobo || 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

export default function LoanRepayment() {
  const { toast } = useToast();
  const [loan, setLoan] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/loans/current').catch(() => ({ data: { loan: null } })),
      api.get('/api/contributions/bank-details').catch(() => ({ data: null })),
    ])
      .then(([loanRes, bankRes]) => {
        setLoan(loanRes.data.loan ?? null);
        setBankDetails(bankRes.data ?? null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, []);

  const handleSubmitPayment = async (installment) => {
    setSubmittingId(installment.id);
    try {
      await api.post('/api/loans/repayment/submit', { installmentId: installment.id });
      toast({ message: 'Payment submitted — awaiting admin confirmation.', type: 'success' });
      fetchData();
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Submission failed. Please try again.', type: 'error' });
    } finally {
      setSubmittingId(null);
    }
  };

  const installments = loan?.installments || [];

  const paidKobo = installments
    .filter((i) => i.status === 'PAID')
    .reduce((s, i) => s + i.amountKobo, 0);

  const remainingKobo = Math.max(0, (loan?.totalRepayableKobo || 0) - paidKobo);

  const columns = [
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (v) =>
        v
          ? new Date(v).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
          : '—',
    },
    {
      key: 'amountKobo',
      label: 'Amount',
      render: (v) => fmt(v),
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <Badge variant={statusVariant[v] || 'neutral'}>
          {statusLabel[v] || v}
        </Badge>
      ),
    },
    {
      key: 'action',
      label: '',
      render: (_, row) => {
        if (row.status === 'PAID') return null;
        if (row.status === 'PENDING_CONFIRMATION') {
          return (
            <span className="text-xs text-amber-600 font-medium">Awaiting admin confirmation</span>
          );
        }
        // PENDING or OVERDUE — show action button
        return (
          <Button
            variant="primary"
            size="sm"
            loading={submittingId === row.id}
            onClick={() => handleSubmitPayment(row)}
          >
            I Have Paid This Installment
          </Button>
        );
      },
    },
  ];

  return (
    <PageTransition>
      <AppLayout title="Loan Repayment">
        <div className="space-y-6 max-w-3xl">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !loan ? (
            <Card className="text-center py-10">
              <p className="text-4xl mb-3" aria-hidden="true">✅</p>
              <p className="font-semibold text-success">No active loan</p>
              <p className="text-sm text-gray-400 mt-1">You currently have no outstanding loan.</p>
            </Card>
          ) : (
            <>
              {/* Loan summary */}
              <Card>
                <h2 className="font-heading font-bold text-primary mb-4">Current Loan</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-400">Requested Amount</p>
                    <p className="font-semibold">{fmt(loan.requestedAmountKobo)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Disbursed Amount</p>
                    <p className="font-semibold">{fmt(loan.disbursedAmountKobo)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Repayable</p>
                    <p className="font-semibold">{fmt(loan.totalRepayableKobo)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Amount Repaid</p>
                    <p className="font-semibold text-success">{fmt(paidKobo)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Remaining Balance</p>
                    <p className="font-semibold text-error">{fmt(remainingKobo)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Status</p>
                    <Badge variant={statusVariant[loan.status] || 'neutral'}>{loan.status}</Badge>
                  </div>
                </div>
              </Card>

              {/* Cooperative bank details */}
              <Card>
                <h2 className="font-heading font-bold text-primary mb-3">Where to Send Payment</h2>
                {bankDetails ? (
                  <>
                    <p className="text-sm text-gray-500 mb-3">
                      Transfer your installment payment to the cooperative's bank account below, then click
                      <strong> "I Have Paid This Installment"</strong> on the relevant row to notify the admin.
                    </p>
                    <div className="bg-sectionBg rounded-xl p-4 space-y-2 text-sm">
                      {bankDetails.bankName && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Bank</span>
                          <span className="font-semibold">{bankDetails.bankName}</span>
                        </div>
                      )}
                      {bankDetails.accountNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Account Number</span>
                          <span className="font-semibold font-mono">{bankDetails.accountNumber}</span>
                        </div>
                      )}
                      {bankDetails.accountName && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Account Name</span>
                          <span className="font-semibold">{bankDetails.accountName}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    Bank account details are not available at the moment. Please contact the admin at{' '}
                    <a href="mailto:omamidasgloballtd@gmail.com" className="text-primary underline">
                      omamidasgloballtd@gmail.com
                    </a>{' '}
                    or <strong>+2347016694445</strong> for payment instructions.
                  </p>
                )}
              </Card>

              {/* Installment schedule */}
              <Card>
                <h2 className="font-heading font-bold text-primary mb-4">Repayment Schedule</h2>
                <Table
                  columns={columns}
                  data={installments}
                  loading={false}
                  emptyMessage="No installment schedule found."
                />
              </Card>
            </>
          )}
        </div>
      </AppLayout>
    </PageTransition>
  );
}
