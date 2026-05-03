export const JOB_STATUSES = [
  { value: 'new',     label: 'New',         color: '#9E9E98', bg: '#F5F4F0' },
  { value: 'visit',   label: 'Appointment', color: '#6366F1', bg: '#EEF2FF' },
  { value: 'quote',   label: 'Quote',       color: '#D97706', bg: '#FFFBEB' },
  { value: 'approve', label: 'Schedule',    color: '#2563EB', bg: '#EFF6FF' },
  { value: 'book',    label: 'Archive',     color: '#7C3AED', bg: '#F5F3FF' },
  { value: 'done',    label: 'Invoice',     color: '#059669', bg: '#ECFDF5' },
];

export const QUOTE_STATUSES = [
  { value: 'draft',    label: 'Draft',    color: '#9E9E98', bg: '#F5F4F0' },
  { value: 'sent',     label: 'Sent',     color: '#2563EB', bg: '#EFF6FF' },
  { value: 'accepted', label: 'Accepted', color: '#059669', bg: '#ECFDF5' },
  { value: 'declined', label: 'Declined', color: '#DC2626', bg: '#FEF2F2' },
];

export const INVOICE_STATUSES = [
  { value: 'draft',             label: 'Draft',             color: '#9E9E98', bg: '#F5F4F0' },
  { value: 'awaiting_payment',  label: 'Awaiting Payment',  color: '#D97706', bg: '#FFFBEB' },
  { value: 'paid',              label: 'Paid',              color: '#059669', bg: '#ECFDF5' },
];

export const TIME_ENTRY_STATUSES = [
  { value: 'pending',  label: 'Pending'  },
  { value: 'approved', label: 'Approved' },
];

function statusLookup(list) {
  return value => list.find(s => s.value === value) || list[0];
}

export const getJobStatus = statusLookup(JOB_STATUSES);
export const getQuoteStatus = statusLookup(QUOTE_STATUSES);
export const getInvoiceStatus = statusLookup(INVOICE_STATUSES);
