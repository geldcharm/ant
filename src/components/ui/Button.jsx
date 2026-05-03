const BASE = 'inline-flex items-center gap-2 font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-sm',
};

const VARIANTS = {
  primary:   'bg-[#E8611A] text-white hover:bg-[#C44E10] shadow-sm hover:shadow',
  secondary: 'bg-white text-[#1A1A18] border border-[#E0DED8] hover:bg-[#F5F4F0]',
  ghost:     'text-[#6B6B66] hover:bg-[#F5F4F0] hover:text-[#1A1A18]',
  danger:    'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  icon,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
}
