/**
 * Transactions.jsx — Filterable transaction history with CSV export.
 */

import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import PageTransition from '../../components/layout/PageTransition';
import api from '../../lib/api';

const typeVariant = {
  CONTRIBUTION: 'info',
  LOAN_DISBURSEMENT: 'warning',
  LOAN_REPAYMENT: 'success',
  REFUND: 'neutral',
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', status: '', dateFrom: '', dateTo: '' });

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/api/admin/transactions', {
      params: { page, limit: 20, ...filters },
    })
      .then((res) => {
        setTransactions(res.data.transactions || res.data.data || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    try {
      const res = await api.get('/api/admin/transactions', {
        params: { ...filters, format: 'csv', limit: 10000 },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore
    }
  };

  const setFilter = (key) => (e) => {
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));
    setPage(1);
  };

  const columns = [
    { key: 'createdAt', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'type', label: 'Type', render: (v) => <Badge variant={typeVariant[v] || 'neutral'}>{v?.replace(/_/g, ' ')}</Badge> },
    { key: 'amountKobo', label: 'Amount', render: (v) => `₦${((v || 0) / 100).toLocaleString()}` },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'SUCCESS' ? 'success' : v === 'FAILED' ? 'error' : 'neutral'}>{v}</Badge> },
    { key: 'reference', label: 'Reference', render: (v) => <span className="font-mono text-xs">{v || '—'}</span> },
  ];

  return (
    <PageTransition>
      <AppLayout title="Transactions">
        <Card>
          <div className="flex flex-wrap gap-3 mb-4 items-end justify-between">
            <div className="flex flex-wrap gap-2">
              <select value={filters.type} onChange={setFilter('type')} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">All Types</option>
                <option value="CONTRIBUTION">Contribution</option>
                <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
                <option value="LOAN_REPAYMENT">Loan Repayment</option>
                <option value="REFUND">Refund</option>
              </select>
              <input type="date" value={filters.dateFrom} onChange={setFilter('dateFrom')} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" aria-label="From date" />
              <input type="date" value={filters.dateTo} onChange={setFilter('dateTo')} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" aria-label="To date" />
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>Export CSV</Button>
          </div>

          <Table columns={columns} data={transactions} loading={loading} emptyMessage="No transactions found." />
          <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} />
        </Card>
      </AppLayout>
    </PageTransition>
  );
}
