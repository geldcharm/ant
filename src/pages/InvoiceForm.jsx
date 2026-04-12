import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createInvoice, updateInvoice, getInvoice, getJob, getQuote, generateInvoiceNumber } from '../db';
import { Button, Card, BackButton } from '../components/ui';
import { INVOICE_STATUSES, TAX_OPTIONS, PAYMENT_TERMS } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';

const EMPTY_ITEM = () => ({ id: uuidv4(), item: '', description: '', quantity: 1, unitPrice: 0, discountPercent: 0, tax: 'GST (15%)', amount: 0 });

function calcItemAmount(item) {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const disc = parseFloat(item.discountPercent) || 0;
  const subtotal = qty * price;
  return subtotal - (subtotal * disc / 100);
}

function calcTotals(items) {
  let subtotal = 0;
  let gstTotal = 0;
  items.forEach(i => {
    const amt = i.amount || 0;
    subtotal += amt;
    const taxOpt = TAX_OPTIONS.find(t => t.label === i.tax);
    if (taxOpt) gstTotal += amt * (taxOpt.rate / 100);
  });
  return { subtotal, gstAmount: gstTotal, total: subtotal + gstTotal };
}

const EMPTY = {
  invoiceNumber: '',
  jobId: '',
  jobRef: '',
  quoteId: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  status: 'draft',
  contactName: '',
  clientAddress: '',
  clientSuburb: '',
  clientCountry: '',
  businessName: '',
  businessAddress: '',
  businessSuburb: '',
  businessPhone: '',
  businessEmail: '',
  businessAbn: '',
  items: [EMPTY_ITEM()],
  subtotal: 0,
  gstAmount: 0,
  total: 0,
  notes: '',
  paymentTerms: 'Net 14 days',
  bankName: '',
  bankBsb: '',
  bankAccount: '',
  logo: '',
};

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  const fromJobId = location.state?.fromJobId;
  const fromQuoteId = location.state?.fromQuoteId;
  const logoRef = useRef();

  const [form, setForm] = useState({ ...EMPTY, invoiceNumber: generateInvoiceNumber() });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      getInvoice(id).then(inv => inv && setForm({ ...EMPTY, ...inv }));
    } else if (fromQuoteId) {
      getQuote(fromQuoteId).then(q => {
        if (!q) return;
        setForm(f => ({
          ...f,
          quoteId: q.id,
          jobId: q.jobId || '',
          jobRef: q.jobRef || '',
          contactName: q.contactName || '',
          clientAddress: q.clientAddress || '',
          clientSuburb: q.clientSuburb || '',
          clientCountry: q.clientCountry || '',
          businessName: q.businessName || '',
          businessAddress: q.businessAddress || '',
          businessSuburb: q.businessSuburb || '',
          businessPhone: q.businessPhone || '',
          businessEmail: q.businessEmail || '',
          businessAbn: q.businessAbn || '',
          items: q.items?.map(i => ({ ...i, id: uuidv4() })) || [EMPTY_ITEM()],
          subtotal: q.subtotal || 0,
          gstAmount: q.gstAmount || 0,
          total: q.total || 0,
          bankName: q.bankName || '',
          bankBsb: q.bankBsb || '',
          bankAccount: q.bankAccount || '',
          logo: q.logo || '',
        }));
      });
    } else if (fromJobId) {
      getJob(fromJobId).then(job => {
        if (!job) return;
        setForm(f => ({
          ...f,
          jobId: job.id,
          jobRef: job.referenceNumber || '',
          contactName: job.contactName || '',
          clientAddress: job.address || '',
          notes: job.description || '',
        }));
      });
    }
  }, [id, fromJobId, fromQuoteId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function updateItem(itemId, field, value) {
    const updated = form.items.map(item => {
      if (item.id !== itemId) return item;
      const next = { ...item, [field]: value };
      next.amount = calcItemAmount(next);
      return next;
    });
    const totals = calcTotals(updated);
    setForm(f => ({ ...f, items: updated, ...totals }));
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, EMPTY_ITEM()] }));
  }

  function removeItem(itemId) {
    let updated = form.items.filter(i => i.id !== itemId);
    if (updated.length === 0) updated = [EMPTY_ITEM()];
    const totals = calcTotals(updated);
    setForm(f => ({ ...f, items: updated, ...totals }));
  }

  function handleLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set('logo', ev.target.result);
    reader.readAsDataURL(file);
  }

  function validate() {
    const e = {};
    if (!form.contactName.trim()) e.contactName = 'Client name is required';
    if (!form.invoiceNumber.trim()) e.invoiceNumber = 'Invoice number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateInvoice(id, form);
        navigate(`/invoices/${id}`);
      } else {
        const inv = await createInvoice(form);
        navigate(`/invoices/${inv.id}`, { replace: true });
      }
    } finally {
      setSaving(false);
    }
  }

  const currentStatus = INVOICE_STATUSES.find(s => s.value === form.status) || INVOICE_STATUSES[0];
  const fmt = v => (v || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-5 md:p-8 max-w-4xl space-y-5 pb-12">
      <div className="flex items-center gap-3">
        <BackButton />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1A1A18]">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
          {form.jobRef && <p className="text-xs text-[#E8611A] mt-0.5">From job {form.jobRef}</p>}
        </div>
      </div>

      <Card className="p-6 md:p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            {form.logo ? (
              <div className="relative group">
                <img src={form.logo} alt="Logo" className="h-16 max-w-[160px] object-contain rounded-lg border border-[#E0DED8]" />
                <button onClick={() => set('logo', '')} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">✕</button>
              </div>
            ) : (
              <button onClick={() => logoRef.current?.click()} className="w-24 h-16 rounded-xl border-2 border-dashed border-[#E0DED8] flex items-center justify-center text-xs text-[#9E9E98] hover:border-[#E8611A]/40 transition-colors">
                + Logo
              </button>
            )}
          </div>
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
            className="px-3 py-1.5 rounded-lg border text-xs font-bold appearance-none cursor-pointer focus:outline-none"
            style={{ color: currentStatus.color, background: currentStatus.bg, borderColor: currentStatus.color + '30' }}
          >
            {INVOICE_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <h2 className="text-3xl font-black text-[#1A1A18] tracking-tight">INVOICE</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <input placeholder="Client name" value={form.contactName} onChange={e => set('contactName', e.target.value)}
              className={`w-full px-0 py-1 border-b text-sm outline-none transition-colors bg-transparent placeholder:text-[#9E9E98] ${errors.contactName ? 'border-red-400' : 'border-[#E0DED8] focus:border-[#E8611A]'}`} />
            {errors.contactName && <p className="text-[10px] text-red-500">{errors.contactName}</p>}
            <input placeholder="Street address" value={form.clientAddress} onChange={e => set('clientAddress', e.target.value)}
              className="w-full px-0 py-1 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98]" />
            <input placeholder="Suburb, State, Postcode" value={form.clientSuburb} onChange={e => set('clientSuburb', e.target.value)}
              className="w-full px-0 py-1 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98]" />
            <input placeholder="Country" value={form.clientCountry} onChange={e => set('clientCountry', e.target.value)}
              className="w-full px-0 py-1 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98]" />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide">Invoice Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full px-0 py-1 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
                className="w-full px-0 py-1 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide">Invoice Number</label>
              <input value={form.invoiceNumber} onChange={e => set('invoiceNumber', e.target.value)}
                className={`w-full px-0 py-1 border-b text-sm font-semibold outline-none transition-colors bg-transparent ${errors.invoiceNumber ? 'border-red-400' : 'border-[#E0DED8] focus:border-[#E8611A]'}`} />
            </div>
          </div>

          <div className="space-y-2">
            <input placeholder="Business Name" value={form.businessName} onChange={e => set('businessName', e.target.value)}
              className="w-full px-0 py-1 border-b border-[#E0DED8] text-sm font-semibold outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98] placeholder:font-normal" />
            <input placeholder="Address" value={form.businessAddress} onChange={e => set('businessAddress', e.target.value)}
              className="w-full px-0 py-1 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98]" />
            <input placeholder="Suburb, State, Postcode" value={form.businessSuburb} onChange={e => set('businessSuburb', e.target.value)}
              className="w-full px-0 py-1 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98]" />
            <input placeholder="Phone" value={form.businessPhone} onChange={e => set('businessPhone', e.target.value)}
              className="w-full px-0 py-1 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98]" />
            <input placeholder="Email" value={form.businessEmail} onChange={e => set('businessEmail', e.target.value)}
              className="w-full px-0 py-1 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98]" />
            <input placeholder="ABN / Org No." value={form.businessAbn} onChange={e => set('businessAbn', e.target.value)}
              className="w-full px-0 py-1 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98]" />
          </div>
        </div>

        {/* Line Items */}
        <div className="border-t border-[#E0DED8] pt-4">
          <div className="hidden sm:grid grid-cols-[100px_1fr_55px_80px_55px_90px_80px_28px] gap-1.5 text-[9px] font-bold text-[#6B6B66] uppercase tracking-wider mb-2 px-1">
            <span>Item</span><span>Description</span><span>Qty</span><span>Unit Price</span><span>Disc %</span><span>Tax</span><span className="text-right">Amount</span><span />
          </div>

          {form.items.map((item, idx) => (
            <div key={item.id}>
              <div className="hidden sm:grid grid-cols-[100px_1fr_55px_80px_55px_90px_80px_28px] gap-1.5 items-center mb-2">
                <input placeholder="e.g. Labour" value={item.item} onChange={e => updateItem(item.id, 'item', e.target.value)}
                  className="w-full px-2 py-1.5 border-b border-dashed border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98]" />
                <input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)}
                  className="w-full px-2 py-1.5 border-b border-dashed border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent" />
                <input type="number" min="0" step="any" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                  className="w-full px-1 py-1.5 border-b border-dashed border-[#E0DED8] text-sm text-center outline-none focus:border-[#E8611A] transition-colors bg-transparent" />
                <input type="number" min="0" step="any" placeholder="0.00" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', e.target.value)}
                  className="w-full px-1 py-1.5 border-b border-dashed border-[#E0DED8] text-sm text-right outline-none focus:border-[#E8611A] transition-colors bg-transparent" />
                <input type="number" min="0" max="100" step="any" value={item.discountPercent} onChange={e => updateItem(item.id, 'discountPercent', e.target.value)}
                  className="w-full px-1 py-1.5 border-b border-dashed border-[#E0DED8] text-sm text-center outline-none focus:border-[#E8611A] transition-colors bg-transparent" />
                <select value={item.tax} onChange={e => updateItem(item.id, 'tax', e.target.value)}
                  className="w-full px-0 py-1.5 border-b border-dashed border-[#E0DED8] text-[11px] outline-none focus:border-[#E8611A] transition-colors bg-transparent appearance-none cursor-pointer">
                  {TAX_OPTIONS.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                </select>
                <p className="text-sm font-semibold text-right text-[#1A1A18] pr-1">${fmt(item.amount)}</p>
                <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-lg text-[#9E9E98] hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors text-xs">✕</button>
              </div>

              <div className="sm:hidden mb-4 p-3 rounded-xl border border-[#E0DED8] bg-[#F9F8F5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#6B6B66]">Line {idx + 1}</span>
                  <button onClick={() => removeItem(item.id)} className="text-xs text-[#9E9E98] hover:text-red-500">✕ Remove</button>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide block mb-1">Item</label>
                  <input placeholder="e.g. Labour" value={item.item} onChange={e => updateItem(item.id, 'item', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E0DED8] bg-white text-sm outline-none focus:border-[#E8611A] placeholder:text-[#9E9E98]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide block mb-1">Description</label>
                  <input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E0DED8] bg-white text-sm outline-none focus:border-[#E8611A]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide block mb-1">Qty</label>
                    <input type="number" min="0" step="any" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E0DED8] bg-white text-sm outline-none focus:border-[#E8611A]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide block mb-1">Unit Price</label>
                    <input type="number" min="0" step="any" placeholder="0.00" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E0DED8] bg-white text-sm outline-none focus:border-[#E8611A]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide block mb-1">Discount %</label>
                    <input type="number" min="0" max="100" step="any" value={item.discountPercent} onChange={e => updateItem(item.id, 'discountPercent', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E0DED8] bg-white text-sm outline-none focus:border-[#E8611A]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide block mb-1">Tax</label>
                    <select value={item.tax} onChange={e => updateItem(item.id, 'tax', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E0DED8] bg-white text-sm outline-none focus:border-[#E8611A] appearance-none">
                      {TAX_OPTIONS.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#E0DED8]">
                  <span className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide">Amount</span>
                  <span className="text-sm font-semibold text-[#1A1A18]">${fmt(item.amount)}</span>
                </div>
              </div>
            </div>
          ))}

          <button onClick={addItem} className="text-sm text-[#E8611A] font-medium mt-2 hover:underline">+ Add a line</button>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-2 border-t border-[#E0DED8] pt-3">
            <div className="flex justify-between text-sm"><span className="text-[#6B6B66]">Subtotal</span><span className="font-semibold text-[#E8611A]">${fmt(form.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[#6B6B66]">GST</span><span className="font-semibold text-[#E8611A]">${fmt(form.gstAmount)}</span></div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-[#E0DED8]"><span>Total AUD</span><span>${fmt(form.total)}</span></div>
          </div>
        </div>

        <div className="border-t border-[#E0DED8] pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide block mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={4}
              placeholder="e.g. Payment due within 14 days. Late payments incur 2% monthly fee."
              className="w-full px-3 py-2.5 rounded-xl border border-dashed border-[#E0DED8] bg-transparent text-sm outline-none focus:border-[#E8611A] transition-colors placeholder:text-[#9E9E98] placeholder:italic resize-none" />
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide">Payment Terms</label>
              <select value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)}
                className="w-full px-0 py-1.5 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent appearance-none cursor-pointer">
                {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6B6B66] uppercase tracking-wide block mb-1">Bank Details</label>
              <input placeholder="Bank name" value={form.bankName} onChange={e => set('bankName', e.target.value)}
                className="w-full px-0 py-1 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98]" />
              <input placeholder="BSB" value={form.bankBsb} onChange={e => set('bankBsb', e.target.value)}
                className="w-full px-0 py-1 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98] mt-1" />
              <input placeholder="Account number" value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)}
                className="w-full px-0 py-1 border-b border-[#E0DED8] text-sm outline-none focus:border-[#E8611A] transition-colors bg-transparent placeholder:text-[#9E9E98] mt-1" />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Invoice'}
        </Button>
      </div>
    </div>
  );
}
