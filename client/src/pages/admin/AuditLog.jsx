/**
 * AuditLog.jsx — Admin audit log with pagination and filters.
 */

import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/api/admin/audit-logs', { params: { page, limit: 25, action: actionFilter } })
      .then((res) => {
        setLogs(res.data.logs || res.data.data || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, actionFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { key: 'admin', label: 'Admin', render: (v) => v?.fullName || '—' },
    { key: 'action', label: 'Action', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'targetType', label: 'Target', render: (v) => v || '—' },
    { key: 'targetId', label: 'Target ID', render: (v) => v ? <span className="font-mono text-xs">{v}</span> : '—' },
    { key: 'createdAt', label: 'Time', render: (v) => v ? new Date(v).toLocaleString() : '—' },
    {
      key: 'metadata', label: 'Details', render: (v, row) =>
        v ? (
          <button
            type="button"
            onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
            className="text-xs text-accent hover:underline"
          >
            {expandedId === row.id ? 'Hide' : 'View'}
          </button>
        ) : '—',
    },
  ];

  return (
    <PageTransition>
      <AppLayout title="Audit Log">
        <Card>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Filter by action…"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <Table columns={columns} data={logs} loading={loading} emptyMessage="No audit log entries." />

          {/* Expanded metadata */}
          {logs.map((log) =>
            expandedId === log.id ? (
              <div key={`meta-${log.id}`} className="mt-2 p-3 bg-sectionBg rounded-xl text-xs font-mono overflow-x-auto">
                <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
              </div>
            ) : null
          )}

          <Pagination page={page} totalPages={Math.ceil(total / 25)} onPageChange={setPage} />
        </Card>
      </AppLayout>
    </PageTransition>
  );
}
