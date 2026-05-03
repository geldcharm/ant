import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  EmptyState,
  StatusBadge,
  SearchBar,
  StatusFilterBar,
  PageHeader,
  ListSkeleton,
  ErrorState,
} from '../components/ui';
import { useInvoices } from '../hooks/useInvoices';
import { INVOICE_STATUSES } from '../constants/statuses';
import { formatDate } from '../lib/dates';
import { formatAmount } from '../lib/currency';
import { EMPTY_LIST } from '../hooks/queryHelpers';

function makeMatcher(needle) {
  if (!needle) return () => true;
  const lower = needle.toLowerCase();
  return inv =>
    inv.invoiceNumber?.toLowerCase().includes(lower) ||
    inv.contactName?.toLowerCase().includes(lower) ||
    inv.clientAddress?.toLowerCase().includes(lower);
}

export default function InvoicesList() {
  const navigate = useNavigate();
  const invoicesQuery = useInvoices();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const invoices = invoicesQuery.data ?? EMPTY_LIST;

  const filtered = useMemo(() => {
    const match = makeMatcher(search);
    return invoices
      .filter(inv => (statusFilter === 'all' || inv.status === statusFilter) && match(inv))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [invoices, statusFilter, search]);

  const counts = useMemo(() => {
    const acc = {};
    for (const s of INVOICE_STATUSES) {
      acc[s.value] = invoices.filter(inv => inv.status === s.value).length;
    }
    return acc;
  }, [invoices]);

  return (
    <div className="p-5 md:p-8 space-y-5 max-w-4xl">
      <PageHeader
        title="Invoices"
        actions={<Button variant="primary" onClick={() => navigate('/invoices/new')}>+ New Invoice</Button>}
      />

      <SearchBar value={search} onChange={setSearch} placeholder="Search invoices, clients, addresses..." />

      <StatusFilterBar
        statuses={INVOICE_STATUSES}
        value={statusFilter}
        onChange={setStatusFilter}
        counts={counts}
        total={invoices.length}
      />

      {invoicesQuery.isLoading ? (
        <ListSkeleton />
      ) : invoicesQuery.error ? (
        <ErrorState message={invoicesQuery.error.message} onRetry={() => invoicesQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="No invoices found"
          subtitle={search ? 'Try a different search term' : 'Create your first invoice to get started'}
          action={!search && (
            <Button variant="primary" onClick={() => navigate('/invoices/new')}>+ New Invoice</Button>
          )}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(inv => <InvoiceRow key={inv.id} invoice={inv} navigate={navigate} />)}
        </div>
      )}
    </div>
  );
}

function InvoiceRow({ invoice, navigate }) {
  return (
    <Card hover onClick={() => navigate(`/invoices/${invoice.id}`)} className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge status={invoice.status} kind="invoice" size="sm" />
            <span className="text-xs text-[#9E9E98] font-mono">{invoice.invoiceNumber}</span>
          </div>
          <h3 className="font-semibold text-[#1A1A18] text-sm">{invoice.contactName || 'No contact'}</h3>
          {invoice.clientAddress && (
            <p className="text-xs text-[#9E9E98] mt-0.5 truncate">
              📍 {invoice.clientAddress}{invoice.clientSuburb ? `, ${invoice.clientSuburb}` : ''}
            </p>
          )}
          {invoice.jobRef && (
            <button
              onClick={e => { e.stopPropagation(); navigate(`/jobs/${invoice.jobId}`); }}
              className="text-xs text-[#E8611A] font-medium mt-1 hover:underline"
            >
              📋 {invoice.jobRef}
            </button>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <p className="text-lg font-bold text-[#1A1A18]">${formatAmount(invoice.total)}</p>
          <p className="text-[10px] text-[#9E9E98]">
            {invoice.items?.length || 0} item{(invoice.items?.length || 0) !== 1 ? 's' : ''}
          </p>
          {invoice.dueDate && (
            <p className="text-[10px] text-[#9E9E98]">Due {formatDate(invoice.dueDate)}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
