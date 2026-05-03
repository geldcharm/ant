import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Modal, BackButton, ListSkeleton, ErrorState, StatusBadge } from '../components/ui';
import { BillingDocumentPreview } from '../features/billing/BillingDocumentPreview';
import { useInvoice, useUpdateInvoice, useDeleteInvoice } from '../hooks/useInvoices';
import { INVOICE_STATUSES, getInvoiceStatus } from '../constants/statuses';
import { exportInvoice } from '../lib/pdf';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoiceQuery = useInvoice(id);
  const updateMutation = useUpdateInvoice();
  const deleteMutation = useDeleteInvoice();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exportError, setExportError] = useState(null);

  if (invoiceQuery.isLoading) return <div className="p-5 md:p-8 max-w-4xl"><ListSkeleton rows={4} /></div>;
  if (invoiceQuery.error) {
    return (
      <div className="p-5 md:p-8 max-w-4xl">
        <ErrorState message={invoiceQuery.error.message} onRetry={() => invoiceQuery.refetch()} />
      </div>
    );
  }
  const invoice = invoiceQuery.data;
  if (!invoice) {
    navigate('/invoices', { replace: true });
    return null;
  }

  const status = getInvoiceStatus(invoice.status);

  function handleStatusChange(newStatus) {
    updateMutation.mutate({ id, data: { status: newStatus } });
  }

  async function handleDelete() {
    await deleteMutation.mutateAsync(id);
    navigate('/invoices');
  }

  function handleExport() {
    setExportError(null);
    try { exportInvoice(invoice); } catch (err) { setExportError(err.message); }
  }

  return (
    <div className="p-5 md:p-8 max-w-4xl space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <BackButton to="/invoices" className="mt-0.5" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={invoice.status} kind="invoice" />
              <h1 className="text-xl font-bold text-[#1A1A18] truncate">{invoice.invoiceNumber}</h1>
            </div>
            <p className="text-sm text-[#6B6B66] mt-1">{invoice.contactName}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={handleExport}>📄 PDF</Button>
          <Button variant="secondary" onClick={() => navigate(`/invoices/${id}/edit`)}>Edit</Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete</Button>
        </div>
      </header>

      {exportError && <p className="text-sm text-red-500" role="alert">{exportError}</p>}

      <Card className="p-4">
        <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide mb-2">Status</p>
        <div className="flex gap-2 flex-wrap">
          {INVOICE_STATUSES.map(s => {
            const active = s.value === invoice.status;
            return (
              <button
                key={s.value}
                onClick={() => handleStatusChange(s.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                style={active
                  ? { background: s.color, color: '#fff', borderColor: s.color }
                  : { background: s.bg, color: s.color, borderColor: s.color + '30' }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </Card>

      <BillingDocumentPreview
        doc={invoice}
        title="INVOICE"
        status={status}
        dateLabel="Invoice Date"
        expiryLabel="Due Date"
        expiryValue={invoice.dueDate}
        numberLabel="Invoice number"
        numberValue={invoice.invoiceNumber}
        jobLink={invoice.jobRef ? (
          <button
            onClick={() => navigate(`/jobs/${invoice.jobId}`)}
            className="text-sm text-[#E8611A] font-semibold hover:underline"
          >
            📋 View linked job {invoice.jobRef} →
          </button>
        ) : null}
      />

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete invoice?">
        <p className="text-sm text-[#6B6B66] mb-5">
          Are you sure you want to delete <strong>{invoice.invoiceNumber}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
