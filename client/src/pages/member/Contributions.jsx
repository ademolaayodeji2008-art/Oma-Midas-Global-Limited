/**
 * Contributions.jsx — Member contributions list and payment.
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

const statusVariant = { PAID: 'success', PENDING: 'neutral', MISSED: 'error', LATE: 'warning' };

export default function Contributions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  const fetchData = () => {
    setLoading(true);
    api.get('/api/contributions')
      .then((res) => setContributions(res.data.contributions || res.data || []))
      .catch(() => toast({ message: 'Failed to load contributions', type: 'error' }))
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, []);

  const streak = React.useMemo(() => {
    const paid = contributions.filter((c) => c.status === 'PAID').length;
    return paid;
  }, [contributions]);

  const handlePayNow = async (contribution) => {
    setPayingId(contribution.id);
    try {
      const res = await api.post('/api/contributions/initialize-payment', {
        contributionId: contribution.id,
      });
      const { accessCode, reference } = res.data;
      const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

      await openPaystackCheckout({
        key: paystackKey,
        email: user.email,
        amountKobo: contribution.amountKobo,
        reference,
        onSuccess: () => {
          toast({ message: 'Payment submitted — processing via webhook.', type: 'success' });
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

  const columns = [
    { key: 'month', label: 'Month', render: (v, row) => {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }) : (months[v - 1] || v);
    }},
    { key: 'amountKobo', label: 'Amount', render: (v) => `₦${((v || 0) / 100).toLocaleString()}` },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={statusVariant[v] || 'neutral'}>{v}</Badge> },
    { key: 'paidAt', label: 'Paid On', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'action', label: '', render: (_, row) =>
      row.status === 'PENDING' ? (
        <Button
          variant="primary"
          size="sm"
          loading={payingId === row.id}
          onClick={() => handlePayNow(row)}
        >
          Pay Now
        </Button>
      ) : null,
    },
  ];

  return (
    <PageTransition>
      <AppLayout title="Contributions">
        <div className="space-y-6">
          {/* Streak card */}
          <Card className="flex items-center gap-4">
            <div className="text-3xl" aria-hidden="true">🔥</div>
            <div>
              <p className="text-sm text-gray-400">Payment Streak</p>
              <p className="font-heading text-2xl font-bold text-primary">{streak} month{streak !== 1 ? 's' : ''}</p>
            </div>
          </Card>

          {/* Table */}
          <Card>
            <h2 className="font-heading font-bold text-primary mb-4">This Cycle&apos;s Contributions</h2>
            <Table columns={columns} data={contributions} loading={loading} emptyMessage="No contributions found for this cycle." />
          </Card>
        </div>
      </AppLayout>
    </PageTransition>
  );
}
