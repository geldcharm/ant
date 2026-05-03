import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button, BackButton } from '../components/ui';
import { BillingDocumentForm, emptyLineItem } from '../features/billing/BillingDocumentForm';
import { useInvoice, useCreateInvoice, useUpdateInvoice } from '../hooks/useInvoices';
import { useJob } from '../hooks/useJobs';
import { useQuote } from '../hooks/useQuotes';
import { nextInvoiceReference } from '../db/invoices';
import { INVOICE_STATUSES, getInvoiceStatus } from '../constants/statuses';
import { isNonEmpty } from '../lib/validation';

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
  items: [emptyLineItem()],
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

function invoiceFromQuote(quote) {
  return {
    quoteId: quote.id,
    jobId: quote.jobId || '',
    jobRef: quote.jobRef || '',
    contactName: quote.contactName || '',
    clientAddress: quote.clientAddress || '',
    clientSuburb: quote.clientSuburb || '',
    clientCountry: quote.clientCountry || '',
    businessName: quote.businessName || '',
    businessAddress: quote.businessAddress || '',
    businessSuburb: quote.businessSuburb || '',
    businessPhone: quote.businessPhone || '',
    businessEmail: quote.businessEmail || '',
    businessAbn: quote.businessAbn || '',
    items: quote.items?.map(i => ({ ...i, id: uuidv4() })) || [emptyLineItem()],
    subtotal: quote.subtotal || 0,
    gstAmount: quote.gstAmount || 0,
    total: quote.total || 0,
    bankName: quote.bankName || '',
    bankBsb: quote.bankBsb || '',
    bankAccount: quote.bankAccount || '',
    logo: quote.logo || '',
  };
}

function invoiceFromJob(job) {
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
  if (!isNonEmpty(form.invoiceNumber)) errors.invoiceNumber = 'Invoice number is required';
  return errors;
}

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  const fromJobId = location.state?.fromJobId;
  const fromQuoteId = location.state?.fromQuoteId;

  const invoiceQuery = useInvoice(id);
  const sourceJobQuery = useJob(!isEdit && !fromQuoteId ? fromJobId : null);
  const sourceQuoteQuery = useQuote(!isEdit ? fromQuoteId : null);
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const [form, setForm] = useState(() => ({ ...EMPTY, invoiceNumber: nextInvoiceReference() }));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit && invoiceQuery.data) setForm({ ...EMPTY, ...invoiceQuery.data });
  }, [isEdit, invoiceQuery.data]);

  useEffect(() => {
    if (!isEdit && sourceQuoteQuery.data) {
      setForm(f => ({ ...f, ...invoiceFromQuote(sourceQuoteQuery.data) }));
    }
  }, [isEdit, sourceQuoteQuery.data]);

  useEffect(() => {
    if (!isEdit && !fromQuoteId && sourceJobQuery.data) {
      setForm(f => ({ ...f, ...invoiceFromJob(sourceJobQuery.data) }));
    }
  }, [isEdit, fromQuoteId, sourceJobQuery.data]);

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

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
        navigate(`/invoices/${id}`);
      } else {
        const created = await createMutation.mutateAsync(form);
        navigate(`/invoices/${created.id}`, { replace: true });
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save invoice' });
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const status = getInvoiceStatus(form.status);

  return (
    <div className="p-5 md:p-8 max-w-4xl space-y-5 pb-12">
      <header className="flex items-center gap-3">
        <BackButton />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1A1A18]">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
          {form.jobRef && <p className="text-xs text-[#E8611A] mt-0.5">From job {form.jobRef}</p>}
        </div>
      </header>

      <BillingDocumentForm
        title="INVOICE"
        numberLabel="Invoice number"
        numberValue={form.invoiceNumber}
        numberError={errors.invoiceNumber}
        onNumberChange={v => setField('invoiceNumber', v)}
        dateLabel="Invoice Date"
        dateValue={form.date}
        onDateChange={v => setField('date', v)}
        expiryLabel="Due Date"
        expiryValue={form.dueDate}
        onExpiryChange={v => setField('dueDate', v)}
        status={status}
        statusOptions={INVOICE_STATUSES}
        onStatusChange={v => setField('status', v)}
        client={form}
        business={form}
        onClientChange={(field, value) => setField(field, value)}
        onBusinessChange={(field, value) => setField(field, value)}
        clientError={errors.contactName}
        items={form.items}
        onItemsChange={handleItemsChange}
        totals={{ subtotal: form.subtotal, gstAmount: form.gstAmount, total: form.total }}
        notes={form.notes}
        onNotesChange={v => setField('notes', v)}
        notesPlaceholder="e.g. Payment due within 14 days. Late payments incur 2% monthly fee."
        paymentTerms={form.paymentTerms}
        onPaymentTermsChange={v => setField('paymentTerms', v)}
        bank={form}
        onBankChange={(field, value) => setField(field, value)}
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
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Invoice'}
        </Button>
      </div>
    </div>
  );
}
