/**
 * LoanRepayment.jsx — Current loan and installment payment page.
 */

import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';
import { openPaystackCheckout } from '../../lib/paystack';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';

const statusVariant = {
  PAID: 'success',
  PENDING: 'neutral',
  OVERDUE: 'error',
  PARTIAL: 'warning',
};

export default function LoanRepayment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loan, setLoan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  const fetchData = () => {
    setLoading(true);
    api.get('/api/loans/active')
      .then((res) => {
        const activeLoan = res.data.loan || res.data;
        setLoan(activeLoan);
        setInstallments(activeLoan?.repaymentSchedule || activeLoan?.installments || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, []);

  const handlePay = async (installment) => {
    setPayingId(installment.id);
    try {
      const res = await api.post('/api/loans/repayment/initialize', {
        installmentId: installment.id,
        loanId: loan.id,
      });
      const { reference } = res.data;
      const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

      await openPaystackCheckout({
        key: paystackKey,
        email: user.email,
        amountKobo: installment.amountKobo,
        reference,
        onSuccess: () => {
          toast({ message: 'Repayment submitted — processing.', type: 'success' });
          setTimeout(fetchData, 2000);
        },
        onClose: () => toast({ message: 'Payment cancelled.', type: 'info' }),
      });
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Payment initiation failed.', type: 'error' });
    } finally {
      setPayingId(null);
    }
  };

  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();

  const columns = [
    { key: 'dueDate', label: 'Due Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'amountKobo', label: 'Amount', render: (v) => `₦${((v || 0) / 100).toLocaleString()}` },
    { key: 'paidAt', label: 'Paid On', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: 'status', label: 'Status', render: (v, row) => {
        const od = !v && isOverdue(row.dueDate) ? 'OVERDUE' : (v || 'PENDING');
        return <Badge variant={statusVariant[od] || 'neutral'}>{od}</Badge>;
      },
    },
    {
      key: 'action', label: '', render: (_, row) => {
        if (row.status === 'PAID') return null;
        return (
          <Button
            variant={isOverdue(row.dueDate) ? 'danger' : 'primary'}
            size="sm"
            loading={payingId === row.id}
            onClick={() => handlePay(row)}
          >
            {isOverdue(row.dueDate) ? 'Pay Overdue' : 'Pay'}
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Loan Amount</p>
                    <p className="font-semibold">₦{((loan.amountKobo || 0) / 100).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Net Disbursed</p>
                    <p className="font-semibold">₦{((loan.netAmountKobo || 0) / 100).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Repayable</p>
                    <p className="font-semibold">₦{((loan.amountKobo || 0) / 100).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Status</p>
                    <Badge variant={statusVariant[loan.status] || 'neutral'}>{loan.status}</Badge>
                  </div>
                </div>
              </Card>

              {/* Installments */}
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
