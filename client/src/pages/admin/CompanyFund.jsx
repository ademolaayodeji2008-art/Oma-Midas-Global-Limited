/**
 * CompanyFund.jsx — Company fund balance, Paystack balance, topup, and ledger.
 */

import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

export default function CompanyFund() {
  const { toast } = useToast();
  const [fund, setFund] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupForm, setTopupForm] = useState({ amountNaira: '', reference: '', note: '' });
  const [topping, setTopping] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/api/admin/company-fund')
      .then((res) => {
        setFund(res.data);
        setLedger(res.data.ledger || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchData, [fetchData]);

  const handleTopup = async (e) => {
    e.preventDefault();
    const amountKobo = Math.round(parseFloat(topupForm.amountNaira || '0') * 100);
    if (amountKobo <= 0) { toast({ message: 'Enter a valid amount.', type: 'warning' }); return; }
    setTopping(true);
    try {
      await api.post('/api/admin/company-fund/topup', {
        amountKobo,
        reference: topupForm.reference,
        note: topupForm.note,
      });
      toast({ message: 'Top-up recorded.', type: 'success' });
      setTopupOpen(false);
      setTopupForm({ amountNaira: '', reference: '', note: '' });
      fetchData();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Top-up failed.', type: 'error' });
    } finally {
      setTopping(false);
    }
  };

  const ledgerColumns = [
    { key: 'createdAt', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'type', label: 'Type', render: (v) => v?.replace(/_/g, ' ') },
    { key: 'amountKobo', label: 'Amount', render: (v) => `₦${((v || 0) / 100).toLocaleString()}` },
    { key: 'balanceAfterKobo', label: 'Balance After', render: (v) => `₦${((v || 0) / 100).toLocaleString()}` },
    { key: 'note', label: 'Note', render: (v) => v || '—' },
  ];

  return (
    <PageTransition>
      <AppLayout title="Company Fund">
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Balance cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Company Fund Balance</p>
                  <p className="font-heading text-3xl font-bold text-primary">
                    <AnimatedCounter value={Math.round((fund?.ledgerBalanceKobo || 0) / 100)} prefix="₦" />
                  </p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Paystack Balance</p>
                  <p className="font-heading text-3xl font-bold text-accent">
                    <AnimatedCounter value={Math.round((fund?.paystackBalanceKobo || 0) / 100)} prefix="₦" />
                  </p>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button variant="primary" size="md" onClick={() => setTopupOpen(true)}>
                  + Record Top-up
                </Button>
              </div>

              {/* Ledger */}
              <Card>
                <h2 className="font-heading font-bold text-primary mb-4">Fund Ledger</h2>
                <Table columns={ledgerColumns} data={ledger} loading={false} emptyMessage="No ledger entries." />
              </Card>
            </>
          )}
        </div>

        {/* Topup modal */}
        <Modal isOpen={topupOpen} onClose={() => setTopupOpen(false)} title="Record Fund Top-up" size="sm">
          <form onSubmit={handleTopup} className="space-y-4">
            <div>
              <label htmlFor="topup-amount" className="block text-sm font-medium text-charcoal mb-1">Amount (₦)</label>
              <input id="topup-amount" type="number" min="0" step="100" value={topupForm.amountNaira}
                onChange={(e) => setTopupForm((p) => ({ ...p, amountNaira: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label htmlFor="topup-ref" className="block text-sm font-medium text-charcoal mb-1">Reference</label>
              <input id="topup-ref" type="text" value={topupForm.reference}
                onChange={(e) => setTopupForm((p) => ({ ...p, reference: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label htmlFor="topup-note" className="block text-sm font-medium text-charcoal mb-1">Note</label>
              <input id="topup-note" type="text" value={topupForm.note}
                onChange={(e) => setTopupForm((p) => ({ ...p, note: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setTopupOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" loading={topping}>Record</Button>
            </div>
          </form>
        </Modal>
      </AppLayout>
    </PageTransition>
  );
}
