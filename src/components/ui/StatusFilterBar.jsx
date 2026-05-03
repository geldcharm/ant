// A horizontally-scrolling bar of status filter pills with counts.
// Used by JobsList, QuotesList, InvoicesList — keeps every list page consistent.
export function StatusFilterBar({ statuses, value, onChange, counts, totalLabel = 'All', total }) {
  const isAllActive = value === 'all';
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => onChange('all')}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
          isAllActive
            ? 'bg-[#1A1A18] text-white border-[#1A1A18]'
            : 'bg-white text-[#6B6B66] border-[#E0DED8] hover:border-[#1A1A18]/30'
        }`}
      >
        {totalLabel} ({total ?? 0})
      </button>
      {statuses.map(s => {
        const isActive = value === s.value;
        return (
          <button
            key={s.value}
            onClick={() => onChange(s.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all"
            style={isActive
              ? { background: s.color, color: '#fff', borderColor: s.color }
              : { background: s.bg, color: s.color, borderColor: s.color + '30' }}
          >
            {s.label} ({counts?.[s.value] ?? 0})
          </button>
        );
      })}
    </div>
  );
}
