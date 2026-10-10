/**
 * Notifications.jsx — Full notifications list with pagination and mark-as-read.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { DollarSign, XCircle, Clock, CheckCircle, CornerUpLeft, Info, Bell } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

export default function Notifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 15;

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/api/notifications', { params: { page, limit } })
      .then((res) => {
        setNotifications(res.data.notifications || res.data || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => toast({ message: 'Failed to load notifications.', type: 'error' }))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarkAll = async () => {
    const ids = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (!ids.length) return;
    try {
      await api.post('/api/notifications/mark-read', { ids });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast({ message: 'All marked as read.', type: 'success' });
    } catch {
      toast({ message: 'Failed to mark notifications.', type: 'error' });
    }
  };

  const typeIconMap = {
    LOAN_APPROVED: DollarSign,
    LOAN_REJECTED: XCircle,
    CONTRIBUTION_DUE: Clock,
    CONTRIBUTION_CONFIRMED: CheckCircle,
    REFUND_APPROVED: CornerUpLeft,
    GENERAL: Info,
  };

  return (
    <PageTransition>
      <AppLayout title="Notifications">
        <Card className="max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-primary">All Notifications</h2>
            <Button variant="ghost" size="sm" onClick={handleMarkAll}>Mark all read</Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Bell size={32} className="mx-auto mb-2 text-gray-300" aria-hidden="true" />
              <p className="text-sm">No notifications yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={['py-4 flex gap-3', !n.isRead ? 'bg-blush/30 -mx-6 px-6' : ''].join(' ')}
                >
                  {(() => { const Icon = typeIconMap[n.type] || Info; return <Icon size={20} aria-hidden="true" className="flex-shrink-0 text-primary mt-0.5" />; })()}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={['text-sm font-medium', !n.isRead ? 'text-charcoal' : 'text-gray-600'].join(' ')}>
                        {n.title || n.message}
                      </p>
                      {!n.isRead && <Badge variant="info">New</Badge>}
                    </div>
                    {n.title && n.message && (
                      <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                    )}
                    <p className="text-xs text-gray-300 mt-1">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
        </Card>
      </AppLayout>
    </PageTransition>
  );
}
