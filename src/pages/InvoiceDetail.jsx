import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getInvoice, updateInvoice, deleteInvoice } from '../db';
import { Card, Button, Modal, BackButton } from '../components/ui';
import { formatDate, INVOICE_STATUSES, getInvoiceStatus } from '../utils/constants';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function load() {
    const inv = await getInvoice(id);
    if (!inv) { navigate('/invoices'); return; }
    setInvoice(inv);
  }

  useEffect(() => { load(); }, [id]);

  async function changeStatus(s) {
    const updated = await updateInvoice(id, { status: s });
    setInvoice(updated);
  }

  async function handleDelete() {
    await deleteInvoice(id);
    navigate('/invoices');
  }

  const fmt = v => (v || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!invoice) return <div className="p-8 text-[#9E9E98]">Loading...</div>;

  const st = getInvoiceStatus(invoice.status);

  return (
    <div className="p-5 md:p-8 max-w-4xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <BackButton to="/invoices" className="mt-0.5" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                style={{ color: st.color, background: st.bg, border: `1px solid ${st.color}30` }}
                className="px-2.5 py-0.5 text-xs rounded-full font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <span style={{ background: st.color }} className="w-1.5 h-1.5 rounded-full inline-block" />
                {st.label}
              </span>
              <h1 className="text-xl font-bold text-[#1A1A18] truncate">{invoice.invoiceNumber}</h1>
            </div>
            <p className="text-sm text-[#6B6B66] mt-1">{invoice.contactName}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="secondary" onClick={() => navigate(`/invoices/${id}/edit`)}>Edit</Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete</Button>
        </div>
      </div>

      {/* Status quick-change */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide mb-2">Status</p>
        <div className="flex gap-2 flex-wrap">
          {INVOICE_STATUSES.map(s => {
            const active = s.value === invoice.status;
            return (
              <button
                key={s.value}
                onClick={() => changeStatus(s.value)}
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

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-2">
          <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide">Bill To</p>
          <p className="font-semibold text-[#1A1A18]">{invoice.contactName}</p>
          {invoice.clientAddress && <p className="text-sm text-[#6B6B66]">{invoice.clientAddress}</p>}
          {invoice.clientSuburb && <p className="text-sm text-[#6B6B66]">{invoice.clientSuburb}</p>}
          {invoice.clientCountry && <p className="text-sm text-[#6B6B66]">{invoice.clientCountry}</p>}
          {invoice.jobRef && (
            <button onClick={() => navigate(`/jobs/${invoice.jobId}`)} className="text-xs text-[#E8611A] font-medium hover:underline">📋 {invoice.jobRef}</button>
          )}
        </Card>
        <Card className="p-4 space-y-2">
          <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide">Details</p>
          <div className="flex justify-between text-sm"><span className="text-[#9E9E98]">Invoice Date</span><span className="font-medium">{formatDate(invoice.date)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#9E9E98]">Due Date</span><span className="font-medium">{formatDate(invoice.dueDate)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#9E9E98]">Payment Terms</span><span className="font-medium">{invoice.paymentTerms || '—'}</span></div>
        </Card>
      </div>

      {/* Line Items */}
      <Card className="p-4 md:p-6">
        <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide mb-3">Line Items</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-[#6B6B66] uppercase tracking-wider border-b border-[#E0DED8]">
                <th className="text-left py-2 pr-2 font-bold">Item</th>
                <th className="text-left py-2 pr-2 font-bold">Description</th>
                <th className="text-center py-2 pr-2 font-bold">Qty</th>
                <th className="text-right py-2 pr-2 font-bold">Unit</th>
                <th className="text-right py-2 font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map(i => (
                <tr key={i.id} className="border-b border-[#E0DED8] last:border-b-0">
                  <td className="py-2 pr-2">{i.item}</td>
                  <td className="py-2 pr-2 text-[#6B6B66]">{i.description}</td>
                  <td className="py-2 pr-2 text-center">{i.quantity}</td>
                  <td className="py-2 pr-2 text-right">${fmt(i.unitPrice)}</td>
                  <td className="py-2 text-right font-semibold">${fmt(i.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-4">
          <div className="w-full sm:w-64 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-[#6B6B66]">Subtotal</span><span className="font-semibold">${fmt(invoice.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[#6B6B66]">GST</span><span className="font-semibold">${fmt(invoice.gstAmount)}</span></div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-[#E0DED8]"><span>Total AUD</span><span>${fmt(invoice.total)}</span></div>
          </div>
        </div>
      </Card>

      {invoice.notes && (
        <Card className="p-4">
          <p className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide mb-2">Notes</p>
          <p className="text-sm text-[#1A1A18] whitespace-pre-wrap">{invoice.notes}</p>
        </Card>
      )}

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete invoice?">
        <p className="text-sm text-[#6B6B66]">This cannot be undone.</p>
        <div className="flex gap-2 mt-5">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
