/**
 * Loans.jsx — Admin loan management with approve/reject/disburse and pending repayments.
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
  PENDING: 'neutral',
  APPROVED: 'success',
  ACTIVE: 'info',
  REJECTED: 'error',
  DISBURSED: 'info',
  REPAID: 'success',
  COMPLETED: 'success',
  DEFAULTED: 'error',
};

function fmt(kobo) {
  return `₦${((kobo || 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

function fmtDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Loans() {
  const { toast } = useToast();

  // Loans state
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
  const [disbursing, setDisbursing] = useState(null);

  // Pending repayments state
  const [repayments, setRepayments] = useState([]);
  const [repaymentsLoading, setRepaymentsLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);
  const [rejectRepaymentModal, setRejectRepaymentModal] = useState(null);
  const [rejectRepaymentReason, setRejectRepaymentReason] = useState('');
  const [rejectingRepayment, setRejectingRepayment] = useState(false);

  const fetchLoans = useCallback(() => {
    setLoading(true);
    api.get('/api/admin/loans', { params: { page, status: statusFilter, limit: 20 } })
      .then((res) => {
        setLoans(res.data.loans || res.data.data || []);
        setTotal(res.data.pagination?.total || res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  const fetchRepayments = useCallback(() => {
    setRepaymentsLoading(true);
    api.get('/api/admin/repayments/pending')
      .then((res) => setRepayments(res.data.installments || []))
      .catch(() => {})
      .finally(() => setRepaymentsLoading(false));
  }, []);

  useEffect(fetchLoans, [fetchLoans]);
  useEffect(fetchRepayments, [fetchRepayments]);

  const handleApprove = async (loan) => {
    if (!confirm(`Approve loan of ${fmt(loan.requestedAmountKobo)} for ${loan.user?.fullName}?`)) return;
    setApproving(loan.id);
    try {
      await api.put(`/api/admin/loans/${loan.id}/approve`);
      toast({ message: 'Loan approved.', type: 'success' });
      fetchLoans();
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Approval failed.', type: 'error' });
    } finally {
      setApproving(null);
    }
  };

  const handleDisburse = async (loan) => {
    if (!confirm(`Mark loan of ${fmt(loan.disbursedAmountKobo)} for ${loan.user?.fullName} as disbursed?`)) return;
    setDisbursing(loan.id);
    try {
      await api.put(`/api/admin/loans/${loan.id}/disburse`);
      toast({ message: 'Loan marked as disbursed.', type: 'success' });
      fetchLoans();
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Could not mark as disbursed.', type: 'error' });
    } finally {
      setDisbursing(null);
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
      fetchLoans();
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Rejection failed.', type: 'error' });
    } finally {
      setRejecting(false);
    }
  };

  const handleConfirmRepayment = async (installment) => {
    setConfirming(installment.id);
    try {
      await api.put(`/api/admin/repayments/${installment.id}/confirm`);
      toast({ message: 'Repayment confirmed.', type: 'success' });
      fetchRepayments();
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Confirmation failed.', type: 'error' });
    } finally {
      setConfirming(null);
    }
  };

  const handleRejectRepayment = async () => {
    setRejectingRepayment(true);
    try {
      await api.put(`/api/admin/repayments/${rejectRepaymentModal.id}/reject`, {
        reason: rejectRepaymentReason,
      });
      toast({ message: 'Repayment submission rejected.', type: 'success' });
      setRejectRepaymentModal(null);
      setRejectRepaymentReason('');
      fetchRepayments();
    } catch (err) {
      toast({ message: err.response?.data?.error || 'Rejection failed.', type: 'error' });
    } finally {
      setRejectingRepayment(false);
    }
  };

  const loanColumns = [
    { key: 'user', label: 'Member', render: (v) => v?.fullName || '—' },
    { key: 'requestedAmountKobo', label: 'Amount', render: (v) => fmt(v) },
    { key: 'feeKobo', label: 'Fee', render: (v) => fmt(v) },
    { key: 'disbursedAmountKobo', label: 'Disbursed', render: (v) => fmt(v) },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={statusVariant[v] || 'neutral'}>{v}</Badge> },
    { key: 'createdAt', label: 'Applied', render: (v) => fmtDate(v) },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
            className="text-xs text-accent hover:underline"
          >
            {expandedId === row.id ? 'Hide' : 'Schedule'}
          </button>
          {row.status === 'PENDING' && (
            <>
              <Button variant="primary" size="sm" loading={approving === row.id} onClick={() => handleApprove(row)}>
                Approve
              </Button>
              <Button variant="danger" size="sm" onClick={() => setRejectModal(row)}>
                Reject
              </Button>
            </>
          )}
          {row.status === 'APPROVED' && (
            <Button variant="primary" size="sm" loading={disbursing === row.id} onClick={() => handleDisburse(row)}>
              Mark Disbursed
            </Button>
          )}
        </div>
      ),
    },
  ];

  const repaymentColumns = [
    { key: 'member', label: 'Member', render: (_, row) => row.loan?.user?.fullName || '—' },
    {
      key: 'bank',
      label: 'Bank',
      render: (_, row) =>
        row.loan?.user?.bankName && row.loan?.user?.accountNumber
          ? `${row.loan.user.bankName} — ${row.loan.user.accountNumber}`
          : '—',
    },
    { key: 'dueDate', label: 'Due Date', render: (v) => fmtDate(v) },
    { key: 'amountKobo', label: 'Amount', render: (v) => fmt(v) },
    { key: 'submittedAt', label: 'Submitted On', render: (v) => fmtDate(v) },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            loading={confirming === row.id}
            onClick={() => handleConfirmRepayment(row)}
          >
            Confirm
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setRejectRepaymentModal(row);
              setRejectRepaymentReason('');
            }}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  const statusFilters = ['PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE', 'COMPLETED', 'REJECTED', 'REPAID'];

  return (
    <PageTransition>
      <AppLayout title="Loan Management">
        {/* Main loans table */}
        <Card className="mb-6">
          {/* Status filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {statusFilters.map((s) => (
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

          <Table columns={loanColumns} data={loans} loading={loading} emptyMessage="No loans found." />

          {/* Expanded installment schedule */}
          {loans.map((loan) =>
            expandedId === loan.id ? (
              <div key={`sched-${loan.id}`} className="mt-2 mb-4 ml-4 p-4 bg-sectionBg rounded-xl">
                <p className="text-xs font-semibold text-primary mb-2">Repayment Schedule</p>
                {(loan.installments || []).length === 0 ? (
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
                      {loan.installments.map((s, i) => (
                        <tr key={i}>
                          <td className="py-1 pr-4">{fmtDate(s.dueDate)}</td>
                          <td className="py-1 pr-4">{fmt(s.amountKobo)}</td>
                          <td className="py-1">
                            <Badge variant={statusVariant[s.status] || 'neutral'}>{s.status}</Badge>
                          </td>
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

        {/* Pending repayments section */}
        <Card>
          <h2 className="font-heading font-bold text-primary mb-4">Pending Repayments</h2>
          {repayments.length === 0 && !repaymentsLoading ? (
            <p className="text-sm text-gray-400">No pending repayment submissions.</p>
          ) : (
            <Table
              columns={repaymentColumns}
              data={repayments}
              loading={repaymentsLoading}
              emptyMessage="No pending repayments."
            />
          )}
        </Card>

        {/* Reject loan modal */}
        <Modal
          isOpen={!!rejectModal}
          onClose={() => { setRejectModal(null); setRejectReason(''); }}
          title="Reject Loan"
          size="sm"
        >
          <p className="text-sm text-gray-500 mb-3">
            Rejecting loan for <strong>{rejectModal?.user?.fullName}</strong>
          </p>
          <label htmlFor="loan-reject-reason" className="block text-sm font-medium text-charcoal mb-1">
            Reason
          </label>
          <textarea
            id="loan-reject-reason"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setRejectModal(null); setRejectReason(''); }}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={rejecting} onClick={handleReject}>
              Reject
            </Button>
          </div>
        </Modal>

        {/* Reject repayment modal */}
        <Modal
          isOpen={!!rejectRepaymentModal}
          onClose={() => { setRejectRepaymentModal(null); setRejectRepaymentReason(''); }}
          title="Reject Repayment Submission"
          size="sm"
        >
          <p className="text-sm text-gray-500 mb-3">
            Rejecting repayment of <strong>{fmt(rejectRepaymentModal?.amountKobo)}</strong> from{' '}
            <strong>{rejectRepaymentModal?.loan?.user?.fullName}</strong>
          </p>
          <label
            htmlFor="repayment-reject-reason"
            className="block text-sm font-medium text-charcoal mb-1"
          >
            Reason (optional)
          </label>
          <textarea
            id="repayment-reject-reason"
            rows={3}
            value={rejectRepaymentReason}
            onChange={(e) => setRejectRepaymentReason(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setRejectRepaymentModal(null); setRejectRepaymentReason(''); }}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={rejectingRepayment} onClick={handleRejectRepayment}>
              Reject
            </Button>
          </div>
        </Modal>
      </AppLayout>
    </PageTransition>
  );
}
