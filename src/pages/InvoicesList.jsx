import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoices } from '../db';
import { Card, Button, EmptyState, BackButton } from '../components/ui';
import { INVOICE_STATUSES, getInvoiceStatus, formatDate } from '../utils/constants';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => { getInvoices().then(inv => { setInvoices(inv); setLoading(false); }); }, []);

  const filtered = invoices.filter(inv => {
    const matchStatus = filter === 'all' || inv.status === filter;
    const matchSearch = !search
      || inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
      || inv.contactName?.toLowerCase().includes(search.toLowerCase())
      || inv.clientAddress?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return (
    <div className="p-5 md:p-8 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-2xl font-bold text-[#1A1A18]">Invoices</h1>
        </div>
        <Button variant="primary" onClick={() => navigate('/invoices/new')}>+ New Invoice</Button>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E98]">🔍</span>
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E0DED8] bg-white text-sm outline-none focus:border-[#E8611A] focus:ring-2 focus:ring-[#E8611A]/10 transition-all"
          placeholder="Search invoices, clients, addresses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${filter === 'all' ? 'bg-[#1A1A18] text-white border-[#1A1A18]' : 'bg-white text-[#6B6B66] border-[#E0DED8] hover:border-[#1A1A18]/30'}`}
        >
          All ({invoices.length})
        </button>
        {INVOICE_STATUSES.map(s => {
          const count = invoices.filter(inv => inv.status === s.value).length;
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

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-[#F5F4F0] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="No invoices found"
          subtitle={search ? 'Try a different search term' : 'Create your first invoice to get started'}
          action={!search && <Button variant="primary" onClick={() => navigate('/invoices/new')}>+ New Invoice</Button>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(inv => {
            const st = getInvoiceStatus(inv.status);
            return (
              <Card key={inv.id} hover onClick={() => navigate(`/invoices/${inv.id}`)} className="p-4">
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
                      <span className="text-xs text-[#9E9E98] font-mono">{inv.invoiceNumber}</span>
                    </div>
                    <h3 className="font-semibold text-[#1A1A18] text-sm">{inv.contactName || 'No contact'}</h3>
                    {inv.clientAddress && <p className="text-xs text-[#9E9E98] mt-0.5 truncate">📍 {inv.clientAddress}{inv.clientSuburb ? `, ${inv.clientSuburb}` : ''}</p>}
                    {inv.jobRef && (
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/jobs/${inv.jobId}`); }}
                        className="text-xs text-[#E8611A] font-medium mt-1 hover:underline"
                      >
                        📋 {inv.jobRef}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="text-lg font-bold text-[#1A1A18]">${inv.total?.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-[#9E9E98]">{inv.items?.length || 0} item{(inv.items?.length || 0) !== 1 ? 's' : ''}</p>
                    {inv.dueDate && <p className="text-[10px] text-[#9E9E98]">Due {formatDate(inv.dueDate)}</p>}
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
