import { getStatus } from '../utils/constants';

export function StatusBadge({ status, size = 'md' }) {
  const s = getStatus(status);
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs';
  return (
    <span
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}30` }}
      className={`${pad} rounded-full font-semibold inline-flex items-center gap-1.5 whitespace-nowrap`}
    >
      <span style={{ background: s.color }} className="w-1.5 h-1.5 rounded-full inline-block" />
      {s.label}
    </span>
  );
}

export function Avatar({ name, color, size = 'md' }) {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-11 h-11 text-base' : 'w-9 h-9 text-sm';
  return (
    <div
      style={{ background: color || '#6366F1' }}
      className={`${sz} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

export function Card({ children, className = '', onClick, hover = false }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-[#E0DED8] ${hover ? 'hover:border-[#E8611A]/40 hover:shadow-md cursor-pointer transition-all duration-200' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({ children, variant = 'primary', size = 'md', onClick, type = 'button', className = '', disabled = false, icon }) {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-sm' };
  const variants = {
    primary: 'bg-[#E8611A] text-white hover:bg-[#C44E10] shadow-sm hover:shadow',
    secondary: 'bg-white text-[#1A1A18] border border-[#E0DED8] hover:bg-[#F5F4F0]',
    ghost: 'text-[#6B6B66] hover:bg-[#F5F4F0] hover:text-[#1A1A18]',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide">{label}</label>}
      <input
        className="w-full px-3 py-2.5 rounded-xl border border-[#E0DED8] bg-[#F9F8F5] text-[#1A1A18] text-sm outline-none focus:border-[#E8611A] focus:ring-2 focus:ring-[#E8611A]/10 transition-all placeholder:text-[#9E9E98]"
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide">{label}</label>}
      <textarea
        className="w-full px-3 py-2.5 rounded-xl border border-[#E0DED8] bg-[#F9F8F5] text-[#1A1A18] text-sm outline-none focus:border-[#E8611A] focus:ring-2 focus:ring-[#E8611A]/10 transition-all placeholder:text-[#9E9E98] resize-none"
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-semibold text-[#6B6B66] uppercase tracking-wide">{label}</label>}
      <select
        className="w-full px-3 py-2.5 rounded-xl border border-[#E0DED8] bg-[#F9F8F5] text-[#1A1A18] text-sm outline-none focus:border-[#E8611A] focus:ring-2 focus:ring-[#E8611A]/10 transition-all appearance-none"
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className={`relative bg-white rounded-t-3xl sm:rounded-2xl w-full ${width} max-h-[90vh] overflow-y-auto shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#E0DED8]">
          <h2 className="font-semibold text-[#1A1A18] text-base">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F5F4F0] flex items-center justify-center text-[#6B6B66] hover:bg-[#E0DED8] transition-colors">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#F5F4F0] flex items-center justify-center text-[#9E9E98] text-2xl">{icon}</div>
      <div>
        <p className="font-semibold text-[#1A1A18] text-sm">{title}</p>
        {subtitle && <p className="text-xs text-[#9E9E98] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
