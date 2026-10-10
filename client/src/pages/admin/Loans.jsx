/**
 * Loans.jsx — Admin loan management with approve/reject.
 */

import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

const statusVariant = {
  PENDING: 'neutral', APPROVED: 'success', ACTIVE: 'info', REJECTED: 'error',
  DISBURSED: 'info', REPAID: 'success', DEFAULTED: 'error',
};

export default function Loans() {
  const { toast } = useToast();
  const [loans, setLoans] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [expandedId, setExpandedId] = useState(null);

  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [approving, setApproving] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/api/admin/loans', { params: { page, status: statusFilter, limit: 20 } })
      .then((res) => {
        setLoans(res.data.loans || res.data.data || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(fetchData, [fetchData]);

  const handleApprove = async (loan) => {
    if (!confirm(`Approve loan of ₦${(loan.amountKobo / 100).toLocaleString()} for ${loan.user?.fullName}?`)) return;
    setApproving(loan.id);
    try {
      await api.put(`/api/admin/loans/${loan.id}/approve`);
      toast({ message: 'Loan approved.', type: 'success' });
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
      await api.put(`/api/admin/loans/${rejectModal.id}/reject`, { reason: rejectReason });
      toast({ message: 'Loan rejected.', type: 'success' });
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
    { key: 'feeKobo', label: 'Fee', render: (v) => `₦${((v || 0) / 100).toLocaleString()}` },
    { key: 'netAmountKobo', label: 'Net Payout', render: (v) => `₦${((v || 0) / 100).toLocaleString()}` },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={statusVariant[v] || 'neutral'}>{v}</Badge> },
    { key: 'createdAt', label: 'Applied', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
            className="text-xs text-accent hover:underline"
          >
            {expandedId === row.id ? 'Hide' : 'Schedule'}
          </button>
          {row.status === 'PENDING' && (
            <>
              <Button variant="primary" size="sm" loading={approving === row.id} onClick={() => handleApprove(row)}>Approve</Button>
              <Button variant="danger" size="sm" onClick={() => setRejectModal(row)}>Reject</Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <AppLayout title="Loan Management">
        <Card>
          {/* Filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'REPAID'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={[
                  'px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
                  statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-sectionBg',
                ].join(' ')}
              >
                {s}
              </button>
            ))}
          </div>

          <Table columns={columns} data={loans} loading={loading} emptyMessage="No loans found." />

          {/* Expanded schedule */}
          {loans.map((loan) =>
            expandedId === loan.id ? (
              <div key={`sched-${loan.id}`} className="mt-2 mb-4 ml-4 p-4 bg-sectionBg rounded-xl">
                <p className="text-xs font-semibold text-primary mb-2">Repayment Schedule</p>
                {(loan.repaymentSchedule || []).length === 0 ? (
                  <p className="text-xs text-gray-400">No schedule found.</p>
                ) : (
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="text-gray-400">
                        <th className="text-left py-1 pr-4">Due Date</th>
                        <th className="text-left py-1 pr-4">Amount</th>
                        <th className="text-left py-1">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loan.repaymentSchedule.map((s, i) => (
                        <tr key={i}>
                          <td className="py-1 pr-4">{s.dueDate ? new Date(s.dueDate).toLocaleDateString() : '—'}</td>
                          <td className="py-1 pr-4">₦{((s.amountKobo || 0) / 100).toLocaleString()}</td>
                          <td className="py-1"><Badge variant={statusVariant[s.status] || 'neutral'}>{s.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : null
          )}

          <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} />
        </Card>

        {/* Reject modal */}
        <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }} title="Reject Loan" size="sm">
          <p className="text-sm text-gray-500 mb-3">
            Rejecting loan for <strong>{rejectModal?.user?.fullName}</strong>
          </p>
          <label htmlFor="loan-reject-reason" className="block text-sm font-medium text-charcoal mb-1">Reason</label>
          <textarea
            id="loan-reject-reason"
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
