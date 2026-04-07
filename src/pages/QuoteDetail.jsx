import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getQuote, updateQuote, deleteQuote } from '../db';
import { Card, Button, Modal } from '../components/ui';
import { formatDate, QUOTE_STATUSES, getQuoteStatus, TAX_OPTIONS } from '../utils/constants';

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function load() {
    const q = await getQuote(id);
    if (!q) { navigate('/quotes'); return; }
    setQuote(q);
  }

  useEffect(() => { load(); }, [id]);

  async function changeStatus(s) {
    const updated = await updateQuote(id, { status: s });
    setQuote(updated);
  }

  async function handleDelete() {
    await deleteQuote(id);
    navigate('/quotes');
  }

  const fmt = v => (v || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function exportPDF() {
    const q = quote;
    const st = getQuoteStatus(q.status);

    const itemsHTML = q.items.map(i => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #E0DED8;font-size:12px">${i.item || ''}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #E0DED8;font-size:12px">${i.description || ''}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #E0DED8;font-size:12px;text-align:center">${i.quantity}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #E0DED8;font-size:12px;text-align:right">$${fmt(i.unitPrice)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #E0DED8;font-size:12px;text-align:center">${i.discountPercent || 0}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #E0DED8;font-size:11px;text-align:center">${i.tax || ''}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #E0DED8;font-size:12px;text-align:right;font-weight:600">$${fmt(i.amount)}</td>
      </tr>
    `).join('');

    const content = `
      <html><head><style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1A1A18; max-width: 820px; margin: 0 auto; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #F5F4F0; }
        .footer { margin-top: 40px; padding-top: 14px; border-top: 1px solid #E0DED8; font-size: 10px; color: #9E9E98; }
      </style></head><body>
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          ${q.logo ? `<img src="${q.logo}" style="height:56px;max-width:140px;object-fit:contain" />` : '<div></div>'}
          <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;background:${st.bg};color:${st.color};border:1px solid ${st.color}30">${st.label}</span>
        </div>

        <div style="font-size:30px;font-weight:900;margin-bottom:20px">QUOTE</div>

        <!-- 3-col info -->
        <div style="display:flex;gap:32px;margin-bottom:24px">
          <div style="flex:1">
            <div style="font-weight:600">${q.contactName || ''}</div>
            ${q.clientAddress ? `<div style="color:#6B6B66">${q.clientAddress}</div>` : ''}
            ${q.clientSuburb ? `<div style="color:#6B6B66">${q.clientSuburb}</div>` : ''}
            ${q.clientCountry ? `<div style="color:#6B6B66">${q.clientCountry}</div>` : ''}
          </div>
          <div style="flex:1">
            <div><span style="color:#9E9E98;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Date</span><br/>${q.date ? formatDate(q.date) : ''}</div>
            <div style="margin-top:8px"><span style="color:#9E9E98;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Expiry</span><br/>${q.validUntil ? formatDate(q.validUntil) : ''}</div>
            <div style="margin-top:8px"><span style="color:#9E9E98;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Quote number</span><br/><strong>${q.quoteNumber}</strong></div>
          </div>
          <div style="flex:1;text-align:right">
            ${q.businessName ? `<div style="font-weight:600">${q.businessName}</div>` : ''}
            ${q.businessAddress ? `<div style="color:#6B6B66">${q.businessAddress}</div>` : ''}
            ${q.businessSuburb ? `<div style="color:#6B6B66">${q.businessSuburb}</div>` : ''}
            ${q.businessPhone ? `<div style="color:#6B6B66">Phone: ${q.businessPhone}</div>` : ''}
            ${q.businessEmail ? `<div style="color:#6B6B66">${q.businessEmail}</div>` : ''}
            ${q.businessAbn ? `<div style="color:#6B6B66">${q.businessAbn}</div>` : ''}
          </div>
        </div>

        ${(q.tradeType || q.licenceNo) ? `
        <div style="display:flex;gap:32px;margin-bottom:20px">
          ${q.tradeType ? `<div><span style="color:#9E9E98;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Trade type</span><br/>${q.tradeType}</div>` : ''}
          ${q.licenceNo ? `<div><span style="color:#9E9E98;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Licence no.</span><br/>${q.licenceNo}</div>` : ''}
        </div>` : ''}

        <!-- Items table -->
        <table>
          <thead>
            <tr>
              <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#6B6B66;font-weight:700">Item</th>
              <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#6B6B66;font-weight:700">Description</th>
              <th style="padding:8px 10px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#6B6B66;font-weight:700">Qty</th>
              <th style="padding:8px 10px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#6B6B66;font-weight:700">Unit Price</th>
              <th style="padding:8px 10px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#6B6B66;font-weight:700">Disc %</th>
              <th style="padding:8px 10px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#6B6B66;font-weight:700">Tax</th>
              <th style="padding:8px 10px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#6B6B66;font-weight:700">Amount</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>

        <!-- Totals -->
        <div style="margin-top:20px;margin-left:auto;width:260px">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span style="color:#6B6B66">Subtotal</span><span style="color:#E8611A;font-weight:600">$${fmt(q.subtotal)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span style="color:#6B6B66">GST</span><span style="color:#E8611A;font-weight:600">$${fmt(q.gstAmount)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:16px;font-weight:700;border-top:2px solid #1A1A18"><span>Total AUD</span><span>$${fmt(q.total)}</span></div>
        </div>

        <!-- Terms + Payment + Bank -->
        <div style="display:flex;gap:32px;margin-top:32px;border-top:1px solid #E0DED8;padding-top:20px">
          <div style="flex:1">
            ${q.notes ? `<div style="font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#9E9E98;font-weight:700;margin-bottom:6px">Terms & Notes</div><div style="font-size:12px;color:#6B6B66;font-style:italic">${q.notes}</div>` : ''}
          </div>
          <div style="flex:1">
            ${q.paymentTerms ? `<div style="font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#9E9E98;font-weight:700;margin-bottom:6px">Payment Terms</div><div style="font-size:12px">${q.paymentTerms}</div>` : ''}
            ${(q.bankName || q.bankBsb || q.bankAccount) ? `
            <div style="margin-top:14px">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#9E9E98;font-weight:700;margin-bottom:6px">Bank Details</div>
              ${q.bankName ? `<div style="font-size:12px">${q.bankName}</div>` : ''}
              ${q.bankBsb ? `<div style="font-size:12px">BSB: ${q.bankBsb}</div>` : ''}
              ${q.bankAccount ? `<div style="font-size:12px">Acc: ${q.bankAccount}</div>` : ''}
            </div>` : ''}
          </div>
        </div>

        <div class="footer">Generated by PaveMaster · ${new Date().toLocaleString('en-GB')}</div>
      </body></html>
    `;
    const win = window.open('', '_blank');
    win.document.write(content);
    win.document.close();
    win.print();
  }

  if (!quote) return <div className="p-8 text-center text-[#9E9E98]">Loading…</div>;

  const st = getQuoteStatus(quote.status);

  return (
    <div className="p-5 md:p-8 max-w-4xl space-y-5">
      {/* Header bar */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/quotes')} className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors mt-0.5">←</button>
        <div className="flex-1 min-w-0">
          <span style={{ color: st.color, background: st.bg, border: `1px solid ${st.color}30` }}
            className="px-3 py-1 text-xs rounded-full font-semibold inline-flex items-center gap-1.5">
            <span style={{ background: st.color }} className="w-1.5 h-1.5 rounded-full inline-block" />
            {st.label}
          </span>
          <h1 className="text-xl font-bold text-[#1A1A18] mt-1">{quote.quoteNumber}</h1>
          <p className="text-sm text-[#9E9E98]">{quote.contactName}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={exportPDF}>📄 PDF</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/quotes/${id}/edit`)}>✏️ Edit</Button>
        </div>
      </div>

      {/* Status Changer */}
      <Card className="p-4">
        <h2 className="font-semibold text-sm text-[#1A1A18] mb-3">Quote Status</h2>
        <select value={quote.status} onChange={e => changeStatus(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-[#E0DED8] bg-white text-sm font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E8611A]/30"
          style={{ color: st.color }}>
          {QUOTE_STATUSES.map(s => (
            <option key={s.value} value={s.value} style={{ color: s.color }}>{s.label}</option>
          ))}
        </select>
      </Card>

      {/* ── Quote Document Preview ─────────────── */}
      <Card className="p-6 md:p-8 space-y-5">

        {/* Logo + status */}
        <div className="flex items-start justify-between">
          {quote.logo ? <img src={quote.logo} alt="Logo" className="h-14 max-w-[140px] object-contain" /> : <div />}
          <span style={{ color: st.color, background: st.bg, border: `1px solid ${st.color}30` }}
            className="px-3 py-1 text-xs rounded-full font-bold">{st.label}</span>
        </div>

        <h2 className="text-3xl font-black text-[#1A1A18] tracking-tight">QUOTE</h2>

        {/* 3-col info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="font-semibold">{quote.contactName}</p>
            {quote.clientAddress && <p className="text-[#6B6B66]">{quote.clientAddress}</p>}
            {quote.clientSuburb && <p className="text-[#6B6B66]">{quote.clientSuburb}</p>}
            {quote.clientCountry && <p className="text-[#6B6B66]">{quote.clientCountry}</p>}
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] font-bold text-[#9E9E98] uppercase tracking-wide">Date</p>
              <p>{quote.date ? formatDate(quote.date) : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#9E9E98] uppercase tracking-wide">Expiry</p>
              <p>{quote.validUntil ? formatDate(quote.validUntil) : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#9E9E98] uppercase tracking-wide">Quote number</p>
              <p className="font-semibold">{quote.quoteNumber}</p>
            </div>
          </div>
          <div className="text-right">
            {quote.businessName && <p className="font-semibold">{quote.businessName}</p>}
            {quote.businessAddress && <p className="text-[#6B6B66]">{quote.businessAddress}</p>}
            {quote.businessSuburb && <p className="text-[#6B6B66]">{quote.businessSuburb}</p>}
            {quote.businessPhone && <p className="text-[#6B6B66]">Phone: {quote.businessPhone}</p>}
            {quote.businessEmail && <p className="text-[#6B6B66]">{quote.businessEmail}</p>}
            {quote.businessAbn && <p className="text-[#6B6B66]">{quote.businessAbn}</p>}
          </div>
        </div>

        {/* Trade / Licence */}
        {(quote.tradeType || quote.licenceNo) && (
          <div className="flex gap-8 text-sm">
            {quote.tradeType && (
              <div>
                <p className="text-[10px] font-bold text-[#9E9E98] uppercase tracking-wide">Trade type</p>
                <p>{quote.tradeType}</p>
              </div>
            )}
            {quote.licenceNo && (
              <div>
                <p className="text-[10px] font-bold text-[#9E9E98] uppercase tracking-wide">Licence no.</p>
                <p>{quote.licenceNo}</p>
              </div>
            )}
          </div>
        )}

        {/* Linked Job */}
        {quote.jobRef && (
          <button onClick={() => navigate(`/jobs/${quote.jobId}`)} className="text-sm text-[#E8611A] font-semibold hover:underline">
            📋 View linked job {quote.jobRef} →
          </button>
        )}

        {/* Items table */}
        <div className="overflow-x-auto border-t border-[#E0DED8] pt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F4F0]">
                <th className="text-left text-[9px] font-bold text-[#6B6B66] uppercase tracking-wider py-2 px-2.5">Item</th>
                <th className="text-left text-[9px] font-bold text-[#6B6B66] uppercase tracking-wider py-2 px-2.5">Description</th>
                <th className="text-center text-[9px] font-bold text-[#6B6B66] uppercase tracking-wider py-2 px-2.5">Qty</th>
                <th className="text-right text-[9px] font-bold text-[#6B6B66] uppercase tracking-wider py-2 px-2.5">Unit Price</th>
                <th className="text-center text-[9px] font-bold text-[#6B6B66] uppercase tracking-wider py-2 px-2.5">Disc %</th>
                <th className="text-center text-[9px] font-bold text-[#6B6B66] uppercase tracking-wider py-2 px-2.5">Tax</th>
                <th className="text-right text-[9px] font-bold text-[#6B6B66] uppercase tracking-wider py-2 px-2.5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {quote.items?.map(item => (
                <tr key={item.id} className="border-b border-[#F0EFEB]">
                  <td className="py-2.5 px-2.5 text-[#1A1A18] font-medium">{item.item}</td>
                  <td className="py-2.5 px-2.5 text-[#6B6B66]">{item.description}</td>
                  <td className="py-2.5 px-2.5 text-center text-[#6B6B66]">{item.quantity}</td>
                  <td className="py-2.5 px-2.5 text-right text-[#6B6B66]">${fmt(item.unitPrice)}</td>
                  <td className="py-2.5 px-2.5 text-center text-[#6B6B66]">{item.discountPercent || 0}</td>
                  <td className="py-2.5 px-2.5 text-center text-[#6B6B66] text-[11px]">{item.tax}</td>
                  <td className="py-2.5 px-2.5 text-right font-semibold">${fmt(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6B66]">Subtotal</span>
              <span className="font-semibold text-[#E8611A]">${fmt(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6B66]">GST</span>
              <span className="font-semibold text-[#E8611A]">${fmt(quote.gstAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t-2 border-[#1A1A18]">
              <span>Total AUD</span>
              <span>${fmt(quote.total)}</span>
            </div>
          </div>
        </div>

        {/* Terms + Payment + Bank */}
        {(quote.notes || quote.paymentTerms || quote.bankName) && (
          <div className="border-t border-[#E0DED8] pt-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {quote.notes && (
              <div>
                <p className="text-[10px] font-bold text-[#9E9E98] uppercase tracking-wide mb-1">Terms & Notes</p>
                <p className="text-[#6B6B66] italic leading-relaxed">{quote.notes}</p>
              </div>
            )}
            <div className="space-y-3">
              {quote.paymentTerms && (
                <div>
                  <p className="text-[10px] font-bold text-[#9E9E98] uppercase tracking-wide mb-1">Payment Terms</p>
                  <p>{quote.paymentTerms}</p>
                </div>
              )}
              {(quote.bankName || quote.bankBsb || quote.bankAccount) && (
                <div>
                  <p className="text-[10px] font-bold text-[#9E9E98] uppercase tracking-wide mb-1">Bank Details</p>
                  {quote.bankName && <p>{quote.bankName}</p>}
                  {quote.bankBsb && <p className="text-[#6B6B66]">BSB: {quote.bankBsb}</p>}
                  {quote.bankAccount && <p className="text-[#6B6B66]">Acc: {quote.bankAccount}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Delete */}
      <div className="pb-8">
        <Button variant="danger" onClick={() => setConfirmDelete(true)} className="w-full">🗑 Delete Quote</Button>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete Quote">
        <p className="text-sm text-[#6B6B66] mb-5">Are you sure you want to delete <strong>{quote.quoteNumber}</strong>? This cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
