export const JOB_STATUSES = [
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
