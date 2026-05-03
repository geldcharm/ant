const FIELD_CLASSES = 'w-full px-3 py-2.5 rounded-xl border border-[#E0DED8] bg-[#F9F8F5] text-[#1A1A18] text-sm outline-none focus:border-[#E8611A] focus:ring-2 focus:ring-[#E8611A]/10 transition-all placeholder:text-[#9E9E98]';
const LABEL_CLASSES = 'text-xs font-semibold text-[#6B6B66] uppercase tracking-wide';

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className={LABEL_CLASSES}>{label}</label>}
      <input className={FIELD_CLASSES} {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', rows = 3, ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className={LABEL_CLASSES}>{label}</label>}
      <textarea className={`${FIELD_CLASSES} resize-none`} rows={rows} {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className={LABEL_CLASSES}>{label}</label>}
      <select className={`${FIELD_CLASSES} appearance-none cursor-pointer`} {...props}>
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
