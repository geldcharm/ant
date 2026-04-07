export const JOB_STATUSES = [
  { value: 'new',     label: 'New',     color: '#9E9E98', bg: '#F5F4F0' },
  { value: 'visit',   label: 'Visit',   color: '#6366F1', bg: '#EEF2FF' },
  { value: 'quote',   label: 'Quote',   color: '#D97706', bg: '#FFFBEB' },
  { value: 'approve', label: 'Approve', color: '#2563EB', bg: '#EFF6FF' },
  { value: 'book',    label: 'Book',    color: '#7C3AED', bg: '#F5F3FF' },
  { value: 'done',    label: 'Done',    color: '#059669', bg: '#ECFDF5' },
];

export function getStatus(value) {
  return JOB_STATUSES.find(s => s.value === value) || JOB_STATUSES[0];
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr;
}

export const QUOTE_STATUSES = [
  { value: 'draft',    label: 'Draft',    color: '#9E9E98', bg: '#F5F4F0' },
  { value: 'sent',     label: 'Sent',     color: '#2563EB', bg: '#EFF6FF' },
  { value: 'accepted', label: 'Accepted', color: '#059669', bg: '#ECFDF5' },
  { value: 'declined', label: 'Declined', color: '#DC2626', bg: '#FEF2F2' },
];

export function getQuoteStatus(value) {
  return QUOTE_STATUSES.find(s => s.value === value) || QUOTE_STATUSES[0];
}

export const TRADE_TYPES = [
  'Paving & Asphalt',
  'Concrete',
  'Landscaping',
  'Plumbing',
  'Electrical',
  'Building',
  'Roofing',
  'Painting',
  'Fencing',
  'Demolition',
  'Earthworks',
  'Other',
];

export const TAX_OPTIONS = [
  { label: 'GST (15%)', rate: 15 },
  { label: 'GST (10%)', rate: 10 },
  { label: 'No Tax (0%)', rate: 0 },
];

export const PAYMENT_TERMS = [
  '50% deposit, balance on completion',
  'Due on completion',
  'Net 7 days',
  'Net 14 days',
  'Net 30 days',
  'Net 60 days',
  'Payment in advance',
];
