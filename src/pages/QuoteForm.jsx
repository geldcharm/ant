import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '../components/ui';
import { BillingDocumentForm, emptyLineItem } from '../features/billing/BillingDocumentForm';
import { useQuote, useCreateQuote, useUpdateQuote } from '../hooks/useQuotes';
import { useJob } from '../hooks/useJobs';
import { nextQuoteReference } from '../db/quotes';
import { QUOTE_STATUSES, getQuoteStatus } from '../constants/statuses';
import { isNonEmpty } from '../lib/validation';

const EMPTY = {
  quoteNumber: '',
  jobId: '',
  jobRef: '',
  date: new Date().toISOString().split('T')[0],
  validUntil: '',
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
  tradeType: '',
  licenceNo: '',
  items: [emptyLineItem()],
  subtotal: 0,
  gstAmount: 0,
  total: 0,
  notes: '',
  paymentTerms: '50% deposit, balance on completion',
  bankName: '',
  bankBsb: '',
  bankAccount: '',
  logo: '',
};

function quoteFromJob(job) {
  return {
    jobId: job.id,
    jobRef: job.referenceNumber || '',
    contactName: job.contactName || '',
    clientAddress: job.address || '',
    notes: job.description || '',
  };
}

function validate(form) {
  const errors = {};
  if (!isNonEmpty(form.contactName)) errors.contactName = 'Client name is required';
  if (!isNonEmpty(form.quoteNumber)) errors.quoteNumber = 'Quote number is required';
  return errors;
}

export default function QuoteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  const fromJobId = location.state?.fromJobId;

  const quoteQuery = useQuote(id);
  const sourceJobQuery = useJob(!isEdit ? fromJobId : null);
  const createMutation = useCreateQuote();
  const updateMutation = useUpdateQuote();

  const [form, setForm] = useState(() => ({ ...EMPTY, quoteNumber: nextQuoteReference() }));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit && quoteQuery.data) setForm({ ...EMPTY, ...quoteQuery.data });
  }, [isEdit, quoteQuery.data]);

  useEffect(() => {
    if (!isEdit && sourceJobQuery.data) {
      setForm(f => ({ ...f, ...quoteFromJob(sourceJobQuery.data) }));
    }
  }, [isEdit, sourceJobQuery.data]);

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  function handleClientChange(field, value) { setField(field, value); }
  function handleBusinessChange(field, value) { setField(field, value); }
  function handleBankChange(field, value) { setField(field, value); }

  function handleItemsChange(items, totals) {
    setForm(f => ({ ...f, items, ...(totals || {}) }));
  }

  async function handleSave() {
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id, data: form });
        navigate(`/quotes/${id}`);
      } else {
        const created = await createMutation.mutateAsync(form);
        navigate(`/quotes/${created.id}`, { replace: true });
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save quote' });
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const status = getQuoteStatus(form.status);

  return (
    <div className="p-5 md:p-8 max-w-4xl space-y-5 pb-12">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-9 h-9 rounded-xl bg-white border border-[#E0DED8] flex items-center justify-center text-[#6B6B66] hover:bg-[#F5F4F0] transition-colors"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1A1A18]">{isEdit ? 'Edit Quote' : 'New Quote'}</h1>
          {form.jobRef && <p className="text-xs text-[#E8611A] mt-0.5">From job {form.jobRef}</p>}
        </div>
      </header>

      <BillingDocumentForm
        title="QUOTE"
        numberLabel="Quote number"
        numberValue={form.quoteNumber}
        numberError={errors.quoteNumber}
        onNumberChange={v => setField('quoteNumber', v)}
        dateLabel="Date"
        dateValue={form.date}
        onDateChange={v => setField('date', v)}
        expiryLabel="Expiry"
        expiryValue={form.validUntil}
        onExpiryChange={v => setField('validUntil', v)}
        status={status}
        statusOptions={QUOTE_STATUSES}
        onStatusChange={v => setField('status', v)}
        showTradeFields
        tradeType={form.tradeType}
        licenceNo={form.licenceNo}
        onTradeChange={v => setField('tradeType', v)}
        onLicenceChange={v => setField('licenceNo', v)}
        client={form}
        business={form}
        onClientChange={handleClientChange}
        onBusinessChange={handleBusinessChange}
        clientError={errors.contactName}
        items={form.items}
        onItemsChange={handleItemsChange}
        totals={{ subtotal: form.subtotal, gstAmount: form.gstAmount, total: form.total }}
        notes={form.notes}
        onNotesChange={v => setField('notes', v)}
        notesPlaceholder="e.g. Quote valid for 30 days. 50% deposit required. All work guaranteed 12 months."
        paymentTerms={form.paymentTerms}
        onPaymentTermsChange={v => setField('paymentTerms', v)}
        bank={form}
        onBankChange={handleBankChange}
        logo={form.logo}
        onLogoChange={v => setField('logo', v)}
        onLogoError={err => setErrors(e => ({ ...e, logo: err.message }))}
      />

      {(errors.submit || errors.logo) && (
        <p className="text-sm text-red-500" role="alert">{errors.submit || errors.logo}</p>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Quote'}
        </Button>
      </div>
    </div>
  );
}
