/**
 * PendingPayments.jsx — Admin page to approve or reject pending contribution payments.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function PendingPayments() {
  const { toast } = useToast();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  // Reject modal state
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/api/admin/contributions/pending')
      .then((res) => setContributions(res.data.contributions || []))
      .catch(() => toast({ message: 'Failed to load pending payments', type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      await api.put(`/api/admin/contributions/${id}/approve`);
      toast({ message: 'Contribution approved successfully', type: 'success' });
      fetchData();
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Approval failed', type: 'error' });
    } finally {
      setApprovingId(null);
    }
  };

  const openRejectModal = (contribution) => {
    setRejectTarget(contribution);
    setRejectReason('');
    setRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await api.put(`/api/admin/contributions/${rejectTarget.id}/reject`, { reason: rejectReason });
      toast({ message: 'Contribution rejected', type: 'success' });
      setRejectModal(false);
      fetchData();
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Rejection failed', type: 'error' });
    } finally {
      setRejecting(false);
    }
  };

  return (
    <PageTransition>
      <AppLayout title="Pending Payments">
        <Card>
          <h2 className="font-heading font-bold text-primary mb-4">Pending Contribution Payments</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : contributions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center gap-3">
              <CheckCircle2 size={40} className="text-emerald-400" />
              <p className="font-medium text-gray-600">No pending payments</p>
              <p className="text-sm text-gray-400">All contribution payments have been processed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="pb-2 pr-4">Member</th>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Month</th>
                    <th className="pb-2 pr-4">Year</th>
                    <th className="pb-2 pr-4">Amount Submitted</th>
                    <th className="pb-2 pr-4">Note</th>
                    <th className="pb-2 pr-4">Submitted On</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {contributions.map((c) => (
                    <tr key={c.id} className="py-2">
                      <td className="py-3 pr-4 font-medium text-charcoal">{c.user?.fullName || '—'}</td>
                      <td className="py-3 pr-4 text-gray-500">{c.user?.email || '—'}</td>
                      <td className="py-3 pr-4">{MONTHS[c.month - 1]}</td>
                      <td className="py-3 pr-4">{c.year}</td>
                      <td className="py-3 pr-4 font-medium">
                        {c.amountSubmittedKobo
                          ? `₦${(c.amountSubmittedKobo / 100).toLocaleString('en-NG')}`
                          : '—'}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 max-w-[160px] truncate" title={c.paymentNote || ''}>
                        {c.paymentNote || '—'}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                        {c.submittedAt
                          ? new Date(c.submittedAt).toLocaleDateString('en-NG', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            loading={approvingId === c.id}
                            onClick={() => handleApprove(c.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => openRejectModal(c)}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Reject modal */}
        <Modal
          isOpen={rejectModal}
          onClose={() => setRejectModal(false)}
          title="Reject Payment"
          size="sm"
        >
          <p className="text-sm text-gray-500 mb-3">
            Rejecting will reset this contribution to <strong>Unpaid</strong> so the member can resubmit.
          </p>
          {rejectTarget && (
            <p className="text-sm font-medium text-charcoal mb-3">
              {rejectTarget.user?.fullName} — {MONTHS[rejectTarget.month - 1]} {rejectTarget.year}
            </p>
          )}
          <label htmlFor="rejectReason" className="block text-sm font-medium text-charcoal mb-1">
            Reason
          </label>
          <textarea
            id="rejectReason"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-4"
            placeholder="e.g. Payment not found in bank account"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={rejecting} onClick={handleReject}>
              Reject Payment
            </Button>
          </div>
        </Modal>
      </AppLayout>
    </PageTransition>
  );
}
