import {
  getJobStatus,
  getQuoteStatus,
  getInvoiceStatus,
} from '../../constants/statuses';

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
};

const KIND_LOOKUPS = {
  job: getJobStatus,
  quote: getQuoteStatus,
  invoice: getInvoiceStatus,
};

export function StatusBadge({ status, kind = 'job', size = 'md' }) {
  const lookup = KIND_LOOKUPS[kind] || getJobStatus;
  const s = lookup(status);
  return (
    <span
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}30` }}
      className={`${SIZE_CLASSES[size]} rounded-full font-semibold inline-flex items-center gap-1.5 whitespace-nowrap`}
    >
      <span style={{ background: s.color }} className="w-1.5 h-1.5 rounded-full inline-block" />
      {s.label}
    </span>
  );
}
