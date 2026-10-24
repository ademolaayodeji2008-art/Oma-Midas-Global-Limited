/**
 * Members.jsx — Pending approvals, all members, and clearance requests tabs.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function Members() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');

  // Pending registrations
  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  // All members
  const [members, setMembers] = useState([]);
  const [membersTotal, setMembersTotal] = useState(0);
  const [membersPage, setMembersPage] = useState(1);
  const [search, setSearch] = useState('');
  const [membersLoading, setMembersLoading] = useState(true);

  // Clearance requests
  const [clearanceRequests, setClearanceRequests] = useState([]);
  const [clearanceLoading, setClearanceLoading] = useState(true);

  // Approve modal
  const [approveModal, setApproveModal] = useState(null);
  const [memberType, setMemberType] = useState('NEW');
  const [approving, setApproving] = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Deny clearance modal
  const [denyModal, setDenyModal] = useState(null);
  const [denyReason, setDenyReason] = useState('');
  const [denying, setDenying] = useState(false);

  // Per-row authorize loading
  const [authorizingId, setAuthorizingId] = useState(null);

  const fetchPending = useCallback(() => {
    setPendingLoading(true);
    api.get('/api/admin/members/pending')
      .then((res) => setPending(res.data.members || res.data || []))
      .catch(() => {})
      .finally(() => setPendingLoading(false));
  }, []);

  const fetchMembers = useCallback(() => {
    setMembersLoading(true);
    api.get('/api/admin/members', { params: { page: membersPage, search, limit: 20 } })
      .then((res) => {
        setMembers(res.data.members || res.data.data || []);
        setMembersTotal(res.data.pagination?.total || 0);
      })
      .catch(() => {})
      .finally(() => setMembersLoading(false));
  }, [membersPage, search]);

  const fetchClearanceRequests = useCallback(() => {
    setClearanceLoading(true);
    api.get('/api/clearance-card/admin/pending')
      .then((res) => setClearanceRequests(res.data || []))
      .catch(() => {})
      .finally(() => setClearanceLoading(false));
  }, []);

  useEffect(fetchPending, [fetchPending]);
  useEffect(fetchMembers, [fetchMembers]);
  useEffect(fetchClearanceRequests, [fetchClearanceRequests]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.put(`/api/admin/members/${approveModal.id}/approve`, { memberType });
      toast({ message: 'Member approved.', type: 'success' });
      setApproveModal(null);
      fetchPending();
      fetchMembers();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Approval failed.', type: 'error' });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast({ message: 'Please enter a reason.', type: 'warning' }); return; }
    setRejecting(true);
    try {
      await api.put(`/api/admin/members/${rejectModal.id}/reject`, { reason: rejectReason });
      toast({ message: 'Member rejected.', type: 'success' });
      setRejectModal(null);
      setRejectReason('');
      fetchPending();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Rejection failed.', type: 'error' });
    } finally {
      setRejecting(false);
    }
  };

  const handleAuthorizeClearance = async (memberId) => {
    setAuthorizingId(memberId);
    try {
      await api.put(`/api/clearance-card/admin/${memberId}/authorize`);
      toast({ message: 'Clearance card authorized.', type: 'success' });
      fetchClearanceRequests();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Authorization failed.', type: 'error' });
    } finally {
      setAuthorizingId(null);
    }
  };

  const handleDenyClearance = async () => {
    if (!denyReason.trim()) { toast({ message: 'Please enter a reason.', type: 'warning' }); return; }
    setDenying(true);
    try {
      await api.put(`/api/clearance-card/admin/${denyModal.id}/deny`, { reason: denyReason });
      toast({ message: 'Clearance request denied.', type: 'success' });
      setDenyModal(null);
      setDenyReason('');
      fetchClearanceRequests();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Denial failed.', type: 'error' });
    } finally {
      setDenying(false);
    }
  };

  const pendingColumns = [
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'bankName', label: 'Bank' },
    { key: 'accountNumber', label: 'Account #' },
    { key: 'createdAt', label: 'Signed Up', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => setApproveModal(row)}>Approve</Button>
          <Button variant="danger" size="sm" onClick={() => setRejectModal(row)}>Reject</Button>
        </div>
      ),
    },
  ];

  const memberColumns = [
    {
      key: 'fullName',
      label: 'Name',
      render: (v, row) => (
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/admin/members/${row.id}`)}
            className="text-primary hover:underline font-medium"
          >
            {v}
          </button>
          {row.clearanceRequestedAt && !row.clearanceAuthorized && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"
              title="Clearance card request pending"
            >
              Clearance Pending
            </span>
          )}
        </span>
      ),
    },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'ACTIVE' ? 'success' : v === 'REJECTED' ? 'error' : 'neutral'}>{v}</Badge> },
    { key: 'createdAt', label: 'Joined', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: 'viewCard', label: '', render: (_, row) => (
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/members/' + row.id + '/clearance-card')}>View Card</Button>
      ),
    },
    {
      key: 'deactivate', label: '', render: (_, row) =>
        row.status === 'ACTIVE' ? (
          <Button variant="danger" size="sm" onClick={async () => {
            if (!confirm(`Deactivate ${row.fullName}?`)) return;
            try {
              await api.delete(`/api/admin/members/${row.id}`);
              toast({ message: 'Member deactivated.', type: 'success' });
              fetchMembers();
            } catch {
              toast({ message: 'Failed to deactivate.', type: 'error' });
            }
          }}>Deactivate</Button>
        ) : null,
    },
  ];

  const clearanceColumns = [
    { key: 'fullName', label: 'Member Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'memberType', label: 'Member Type', render: (v) => <Badge variant="info">{v}</Badge> },
    {
      key: 'clearanceRequestedAt',
      label: 'Requested On',
      render: (v) => v ? new Date(v).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            loading={authorizingId === row.id}
            onClick={() => handleAuthorizeClearance(row.id)}
          >
            Authorize
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => { setDenyModal(row); setDenyReason(''); }}
          >
            Deny
          </Button>
        </div>
      ),
    },
  ];

  const tabs = [
    { key: 'pending',   label: `Pending Approvals${pending.length > 0 ? ` (${pending.length})` : ''}` },
    { key: 'all',       label: 'All Members' },
    { key: 'clearance', label: `Clearance Requests${clearanceRequests.length > 0 ? ` (${clearanceRequests.length})` : ''}` },
  ];

  return (
    <PageTransition>
      <AppLayout title="Members">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={[
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                tab === key ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-charcoal hover:bg-sectionBg',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'pending' && (
          <Card>
            <h2 className="font-heading font-bold text-primary mb-4">Pending Approvals</h2>
            <Table columns={pendingColumns} data={pending} loading={pendingLoading} emptyMessage="No pending approvals." />
          </Card>
        )}

        {tab === 'all' && (
          <Card>
            <div className="flex gap-3 mb-4">
              <input
                type="search"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setMembersPage(1); }}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <Table columns={memberColumns} data={members} loading={membersLoading} emptyMessage="No members found." />
            <Pagination page={membersPage} totalPages={Math.ceil(membersTotal / 20)} onPageChange={setMembersPage} />
          </Card>
        )}

        {tab === 'clearance' && (
          <Card>
            <h2 className="font-heading font-bold text-primary mb-4">Clearance Card Requests</h2>
            <Table
              columns={clearanceColumns}
              data={clearanceRequests}
              loading={clearanceLoading}
              emptyMessage="No pending clearance card requests."
            />
          </Card>
        )}

        {/* Approve modal */}
        <Modal isOpen={!!approveModal} onClose={() => setApproveModal(null)} title="Approve Member" size="sm">
          <p className="text-sm text-gray-500 mb-4">Approving <strong>{approveModal?.fullName}</strong></p>
          <label className="block text-sm font-medium text-charcoal mb-2">Member Type</label>
          <select
            value={memberType}
            onChange={(e) => setMemberType(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="NEW">New Member</option>
            <option value="EXISTING">Existing Member (carried over)</option>
          </select>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setApproveModal(null)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={approving} onClick={handleApprove}>Approve</Button>
          </div>
        </Modal>

        {/* Reject modal */}
        <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }} title="Reject Member" size="sm">
          <p className="text-sm text-gray-500 mb-3">Rejecting <strong>{rejectModal?.fullName}</strong></p>
          <label htmlFor="reject-reason" className="block text-sm font-medium text-charcoal mb-1">Reason (required)</label>
          <textarea
            id="reject-reason"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Enter rejection reason…"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" size="sm" loading={rejecting} onClick={handleReject}>Reject</Button>
          </div>
        </Modal>

        {/* Deny clearance modal */}
        <Modal
          isOpen={!!denyModal}
          onClose={() => { setDenyModal(null); setDenyReason(''); }}
          title="Deny Clearance Request"
          size="sm"
        >
          <p className="text-sm text-gray-500 mb-3">
            Denying clearance card request for <strong>{denyModal?.fullName}</strong>
          </p>
          <label htmlFor="deny-reason" className="block text-sm font-medium text-charcoal mb-1">Reason (required)</label>
          <textarea
            id="deny-reason"
            rows={3}
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Enter reason for denial…"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setDenyModal(null); setDenyReason(''); }}>Cancel</Button>
            <Button variant="danger" size="sm" loading={denying} onClick={handleDenyClearance}>Deny</Button>
          </div>
        </Modal>
      </AppLayout>
    </PageTransition>
  );
}
