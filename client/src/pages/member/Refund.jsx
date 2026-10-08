/**
 * Refund.jsx — Request savings refund.
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

const statusVariant = { PENDING: 'neutral', APPROVED: 'success', REJECTED: 'error' };

export default function Refund() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/refunds'),
      api.get('/api/contributions'),
    ])
      .then(([refundRes, contribRes]) => {
        const r = refundRes.data;
        setRefunds(r.refunds || r || []);

        const contribs = contribRes.data.contributions || contribRes.data || [];
        const savingsKobo = contribs
          .filter((c) => c.status === 'PAID')
          .reduce((sum, c) => sum + (c.amountKobo || 0), 0);
        setData({ savingsKobo, hasActiveLoan: r.hasActiveLoan || false });
      })
      .catch(() => toast({ message: 'Failed to load data.', type: 'error' }))
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, []);

  const handleRequest = async () => {
    if (!data?.savingsKobo) return;
    setSubmitting(true);
    try {
      await api.post('/api/refunds', { amountKobo: data.savingsKobo });
      toast({ message: 'Refund request submitted!', type: 'success' });
      fetchData();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Failed to submit refund.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'amountKobo', label: 'Amount', render: (v) => `₦${((v || 0) / 100).toLocaleString()}` },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={statusVariant[v] || 'neutral'}>{v}</Badge> },
    { key: 'createdAt', label: 'Requested', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'updatedAt', label: 'Updated', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
  ];

  return (
    <PageTransition>
      <AppLayout title="Savings Refund">
        <div className="space-y-6 max-w-2xl">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Balance card */}
              <Card>
                <h2 className="font-heading font-bold text-primary mb-2">Savings Balance</h2>
                <p className="text-3xl font-bold text-charcoal">
                  ₦{((data?.savingsKobo || 0) / 100).toLocaleString()}
                </p>

                {data?.hasActiveLoan ? (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-warning">
                    ⚠️ You have an outstanding loan. Refunds are not available until your loan is fully repaid.
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    className="mt-4"
                    loading={submitting}
                    disabled={!data?.savingsKobo || data.savingsKobo <= 0}
                    onClick={handleRequest}
                  >
                    Request Refund of ₦{((data?.savingsKobo || 0) / 100).toLocaleString()}
                  </Button>
                )}
              </Card>

              {/* Existing requests */}
              <Card>
                <h2 className="font-heading font-bold text-primary mb-4">Refund History</h2>
                <Table
                  columns={columns}
                  data={refunds}
                  loading={false}
                  emptyMessage="No refund requests found."
                />
              </Card>
            </>
          )}
        </div>
      </AppLayout>
    </PageTransition>
  );
}
