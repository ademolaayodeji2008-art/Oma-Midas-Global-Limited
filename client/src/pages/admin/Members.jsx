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

  // Add member modal
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [adding, setAdding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleAddMember = async () => {
    // Validation
    if (!newMember.name.trim()) {
      toast({ message: 'Please enter member name.', type: 'warning' });
      return;
    }
    if (!newMember.email.trim()) {
      toast({ message: 'Please enter email address.', type: 'warning' });
      return;
    }
    if (!newMember.phoneNumber.trim()) {
      toast({ message: 'Please enter phone number.', type: 'warning' });
      return;
    }
    if (!newMember.password || newMember.password.length < 6) {
      toast({ message: 'Password must be at least 6 characters.', type: 'warning' });
      return;
    }

    setAdding(true);
    try {
      await api.post('/api/admin/members', {
        name: newMember.name,
        email: newMember.email,
        phoneNumber: newMember.phoneNumber,
        password: newMember.password,
      });
      toast({ message: 'Member added successfully!', type: 'success' });
      setAddMemberModal(false);
      setNewMember({ name: '', email: '', phoneNumber: '', password: '' });
      fetchMembers();
    } catch (err) {
      toast({ 
        message: err.response?.data?.message || 'Failed to add member.', 
        type: 'error' 
      });
    } finally {
      setAdding(false);
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
            <div className="flex gap-3 mb-4 items-center">
              <input
                type="search"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setMembersPage(1); }}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => setAddMemberModal(true)}
              >
                + Add Member
              </Button>
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

        {/* Add member modal */}
        <Modal
          isOpen={addMemberModal}
          onClose={() => {
            setAddMemberModal(false);
            setNewMember({ name: '', email: '', phoneNumber: '', password: '' });
          }}
          title="Add New Member"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="member-name" className="block text-sm font-medium text-charcoal mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="member-name"
                type="text"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label htmlFor="member-email" className="block text-sm font-medium text-charcoal mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="member-email"
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="member@example.com"
              />
            </div>

            <div>
              <label htmlFor="member-phone" className="block text-sm font-medium text-charcoal mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="member-phone"
                type="tel"
                value={newMember.phoneNumber}
                onChange={(e) => setNewMember({ ...newMember, phoneNumber: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="08012345678"
              />
            </div>

            <div>
              <label htmlFor="member-password" className="block text-sm font-medium text-charcoal mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="member-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newMember.password}
                  onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10"
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Member will use this password to login</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> Member will be created as ACTIVE and can login immediately. 
                You may want to inform them of their login credentials.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setAddMemberModal(false);
                setNewMember({ name: '', email: '', phoneNumber: '', password: '' });
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              loading={adding} 
              onClick={handleAddMember}
            >
              Add Member
            </Button>
          </div>
        </Modal>
      </AppLayout>
    </PageTransition>
  );
}
