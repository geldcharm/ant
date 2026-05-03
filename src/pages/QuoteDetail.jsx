import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Modal, BackButton, ListSkeleton, ErrorState, StatusBadge } from '../components/ui';
import { BillingDocumentPreview } from '../features/billing/BillingDocumentPreview';
import { useQuote, useUpdateQuote, useDeleteQuote } from '../hooks/useQuotes';
import { QUOTE_STATUSES, getQuoteStatus } from '../constants/statuses';
import { exportQuote } from '../lib/pdf';

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quoteQuery = useQuote(id);
  const updateMutation = useUpdateQuote();
  const deleteMutation = useDeleteQuote();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exportError, setExportError] = useState(null);

  if (quoteQuery.isLoading) return <div className="p-5 md:p-8 max-w-4xl"><ListSkeleton rows={4} /></div>;
  if (quoteQuery.error) {
    return (
      <div className="p-5 md:p-8 max-w-4xl">
        <ErrorState message={quoteQuery.error.message} onRetry={() => quoteQuery.refetch()} />
      </div>
    );
  }
  const quote = quoteQuery.data;
  if (!quote) {
    navigate('/quotes', { replace: true });
    return null;
  }

  const status = getQuoteStatus(quote.status);

  function handleStatusChange(newStatus) {
    updateMutation.mutate({ id, data: { status: newStatus } });
  }

  async function handleDelete() {
    await deleteMutation.mutateAsync(id);
    navigate('/quotes');
  }

  function handleExport() {
    setExportError(null);
    try { exportQuote(quote); } catch (err) { setExportError(err.message); }
  }

  return (
    <div className="p-5 md:p-8 max-w-4xl space-y-5">
      <header className="flex items-start gap-3">
        <BackButton to="/quotes" className="mt-0.5" />
        <div className="flex-1 min-w-0">
          <StatusBadge status={quote.status} kind="quote" />
          <h1 className="text-xl font-bold text-[#1A1A18] mt-1">{quote.quoteNumber}</h1>
          <p className="text-sm text-[#9E9E98]">{quote.contactName}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={handleExport}>📄 PDF</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/quotes/${id}/edit`)}>✏️ Edit</Button>
        </div>
      </header>

      {exportError && <p className="text-sm text-red-500" role="alert">{exportError}</p>}

      <Card className="p-4">
        <h2 className="font-semibold text-sm text-[#1A1A18] mb-3">Quote Status</h2>
        <select
          value={quote.status}
          onChange={e => handleStatusChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-[#E0DED8] bg-white text-sm font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E8611A]/30"
          style={{ color: status.color }}
          aria-label="Quote status"
        >
          {QUOTE_STATUSES.map(s => (
            <option key={s.value} value={s.value} style={{ color: s.color }}>{s.label}</option>
          ))}
        </select>
      </Card>

      <BillingDocumentPreview
        doc={quote}
        title="QUOTE"
        status={status}
        dateLabel="Date"
        expiryLabel="Expiry"
        expiryValue={quote.validUntil}
        numberLabel="Quote number"
        numberValue={quote.quoteNumber}
        showTradeFields
        jobLink={quote.jobRef ? (
          <button
            onClick={() => navigate(`/jobs/${quote.jobId}`)}
            className="text-sm text-[#E8611A] font-semibold hover:underline"
          >
            📋 View linked job {quote.jobRef} →
          </button>
        ) : null}
      />

      <div className="pb-8">
        <Button variant="danger" onClick={() => setConfirmDelete(true)} className="w-full">
          🗑 Delete Quote
        </Button>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete Quote">
        <p className="text-sm text-[#6B6B66] mb-5">
          Are you sure you want to delete <strong>{quote.quoteNumber}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
