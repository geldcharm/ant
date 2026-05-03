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
import { useQuotes } from '../hooks/useQuotes';
import { QUOTE_STATUSES } from '../constants/statuses';
import { formatDate } from '../lib/dates';
import { formatAmount } from '../lib/currency';
import { EMPTY_LIST } from '../hooks/queryHelpers';

function makeMatcher(needle) {
  if (!needle) return () => true;
  const lower = needle.toLowerCase();
  return q =>
    q.quoteNumber?.toLowerCase().includes(lower) ||
    q.contactName?.toLowerCase().includes(lower) ||
    q.clientAddress?.toLowerCase().includes(lower);
}

export default function QuotesList() {
  const navigate = useNavigate();
  const quotesQuery = useQuotes();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const quotes = quotesQuery.data ?? EMPTY_LIST;

  const filtered = useMemo(() => {
    const match = makeMatcher(search);
    return quotes
      .filter(q => (statusFilter === 'all' || q.status === statusFilter) && match(q))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [quotes, statusFilter, search]);

  const counts = useMemo(() => {
    const acc = {};
    for (const s of QUOTE_STATUSES) {
      acc[s.value] = quotes.filter(q => q.status === s.value).length;
    }
    return acc;
  }, [quotes]);

  return (
    <div className="p-5 md:p-8 space-y-5 max-w-4xl">
      <PageHeader
        title="Quotes"
        actions={<Button variant="primary" onClick={() => navigate('/quotes/new')}>+ New Quote</Button>}
      />

      <SearchBar value={search} onChange={setSearch} placeholder="Search quotes, clients, addresses..." />

      <StatusFilterBar
        statuses={QUOTE_STATUSES}
        value={statusFilter}
        onChange={setStatusFilter}
        counts={counts}
        total={quotes.length}
      />

      {quotesQuery.isLoading ? (
        <ListSkeleton />
      ) : quotesQuery.error ? (
        <ErrorState message={quotesQuery.error.message} onRetry={() => quotesQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No quotes found"
          subtitle={search ? 'Try a different search term' : 'Create your first quote to get started'}
          action={!search && (
            <Button variant="primary" onClick={() => navigate('/quotes/new')}>+ New Quote</Button>
          )}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(q => <QuoteRow key={q.id} quote={q} navigate={navigate} />)}
        </div>
      )}
    </div>
  );
}

function QuoteRow({ quote, navigate }) {
  return (
    <Card hover onClick={() => navigate(`/quotes/${quote.id}`)} className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge status={quote.status} kind="quote" size="sm" />
            <span className="text-xs text-[#9E9E98] font-mono">{quote.quoteNumber}</span>
          </div>
          <h3 className="font-semibold text-[#1A1A18] text-sm">{quote.contactName || 'No contact'}</h3>
          {quote.clientAddress && (
            <p className="text-xs text-[#9E9E98] mt-0.5 truncate">
              📍 {quote.clientAddress}{quote.clientSuburb ? `, ${quote.clientSuburb}` : ''}
            </p>
          )}
          {quote.jobRef && (
            <button
              onClick={e => { e.stopPropagation(); navigate(`/jobs/${quote.jobId}`); }}
              className="text-xs text-[#E8611A] font-medium mt-1 hover:underline"
            >
              📋 {quote.jobRef}
            </button>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <p className="text-lg font-bold text-[#1A1A18]">${formatAmount(quote.total)}</p>
          <p className="text-[10px] text-[#9E9E98]">
            {quote.items?.length || 0} item{(quote.items?.length || 0) !== 1 ? 's' : ''}
          </p>
          {quote.validUntil && (
            <p className="text-[10px] text-[#9E9E98]">Valid until {formatDate(quote.validUntil)}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
