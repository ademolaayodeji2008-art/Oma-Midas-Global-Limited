/**
 * Refunds.jsx — Admin refund management.
 */

import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

const statusVariant = { PENDING: 'neutral', APPROVED: 'success', REJECTED: 'error' };

export default function Refunds() {
  const { toast } = useToast();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [approving, setApproving] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/api/admin/refunds')
      .then((res) => setRefunds(res.data.refunds || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchData, [fetchData]);

  const handleApprove = async (refund) => {
    if (!confirm(`Approve refund of ₦${(refund.amountKobo / 100).toLocaleString()} for ${refund.user?.fullName}?`)) return;
    setApproving(refund.id);
    try {
      await api.put(`/api/admin/refunds/${refund.id}/approve`);
      toast({ message: 'Refund approved.', type: 'success' });
      fetchData();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Approval failed.', type: 'error' });
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast({ message: 'Enter a reason.', type: 'warning' }); return; }
    setRejecting(true);
    try {
      await api.put(`/api/admin/refunds/${rejectModal.id}/reject`, { reason: rejectReason });
      toast({ message: 'Refund rejected.', type: 'success' });
      setRejectModal(null);
      setRejectReason('');
      fetchData();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Rejection failed.', type: 'error' });
    } finally {
      setRejecting(false);
    }
  };

  const columns = [
    { key: 'user', label: 'Member', render: (v) => v?.fullName || '—' },
    { key: 'amountKobo', label: 'Amount', render: (v) => `₦${((v || 0) / 100).toLocaleString()}` },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={statusVariant[v] || 'neutral'}>{v}</Badge> },
    { key: 'createdAt', label: 'Requested', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: 'actions', label: '', render: (_, row) =>
        row.status === 'PENDING' ? (
          <div className="flex gap-2">
            <Button variant="primary" size="sm" loading={approving === row.id} onClick={() => handleApprove(row)}>Approve</Button>
            <Button variant="danger" size="sm" onClick={() => setRejectModal(row)}>Reject</Button>
          </div>
        ) : null,
    },
  ];

  return (
    <PageTransition>
      <AppLayout title="Refund Requests">
        <Card>
          <h2 className="font-heading font-bold text-primary mb-4">Refund Requests</h2>
          <Table columns={columns} data={refunds} loading={loading} emptyMessage="No refund requests." />
        </Card>

        <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }} title="Reject Refund" size="sm">
          <p className="text-sm text-gray-500 mb-3">Rejecting refund for <strong>{rejectModal?.user?.fullName}</strong></p>
          <label htmlFor="refund-reject-reason" className="block text-sm font-medium text-charcoal mb-1">Reason</label>
          <textarea
            id="refund-reject-reason"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" size="sm" loading={rejecting} onClick={handleReject}>Reject</Button>
          </div>
        </Modal>
      </AppLayout>
    </PageTransition>
  );
}
