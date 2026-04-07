import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuotes } from '../db';
import { Card, Button, EmptyState } from '../components/ui';
import { QUOTE_STATUSES, getQuoteStatus, formatDate } from '../utils/constants';

export default function QuotesList() {
  const [quotes, setQuotes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => { getQuotes().then(setQuotes); }, []);

  const filtered = quotes.filter(q => {
    const matchStatus = filter === 'all' || q.status === filter;
    const matchSearch = !search
      || q.quoteNumber?.toLowerCase().includes(search.toLowerCase())
      || q.contactName?.toLowerCase().includes(search.toLowerCase())
      || q.clientAddress?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return (
    <div className="p-5 md:p-8 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A18]">Quotes</h1>
        <Button variant="primary" onClick={() => navigate('/quotes/new')}>+ New Quote</Button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E98]">🔍</span>
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E0DED8] bg-white text-sm outline-none focus:border-[#E8611A] focus:ring-2 focus:ring-[#E8611A]/10 transition-all"
          placeholder="Search quotes, clients, addresses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${filter === 'all' ? 'bg-[#1A1A18] text-white border-[#1A1A18]' : 'bg-white text-[#6B6B66] border-[#E0DED8] hover:border-[#1A1A18]/30'}`}
        >
          All ({quotes.length})
        </button>
        {QUOTE_STATUSES.map(s => {
          const count = quotes.filter(q => q.status === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all"
              style={filter === s.value
                ? { background: s.color, color: '#fff', borderColor: s.color }
                : { background: s.bg, color: s.color, borderColor: s.color + '30' }}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No quotes found"
          subtitle={search ? 'Try a different search term' : 'Create your first quote to get started'}
          action={!search && <Button variant="primary" onClick={() => navigate('/quotes/new')}>+ New Quote</Button>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(q => {
            const st = getQuoteStatus(q.status);
            return (
              <Card key={q.id} hover onClick={() => navigate(`/quotes/${q.id}`)} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        style={{ color: st.color, background: st.bg, border: `1px solid ${st.color}30` }}
                        className="px-2 py-0.5 text-xs rounded-full font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <span style={{ background: st.color }} className="w-1.5 h-1.5 rounded-full inline-block" />
                        {st.label}
                      </span>
                      <span className="text-xs text-[#9E9E98] font-mono">{q.quoteNumber}</span>
                    </div>
                    <h3 className="font-semibold text-[#1A1A18] text-sm">{q.contactName || 'No contact'}</h3>
                    {q.clientAddress && <p className="text-xs text-[#9E9E98] mt-0.5 truncate">📍 {q.clientAddress}{q.clientSuburb ? `, ${q.clientSuburb}` : ''}</p>}
                    {q.jobRef && (
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/jobs/${q.jobId}`); }}
                        className="text-xs text-[#E8611A] font-medium mt-1 hover:underline"
                      >
                        📋 {q.jobRef}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="text-lg font-bold text-[#1A1A18]">${q.total?.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-[#9E9E98]">{q.items?.length || 0} item{(q.items?.length || 0) !== 1 ? 's' : ''}</p>
                    {q.validUntil && <p className="text-[10px] text-[#9E9E98]">Valid until {formatDate(q.validUntil)}</p>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
