export function SearchBar({ value, onChange, placeholder, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E98]">🔍</span>
      <input
        type="search"
        aria-label={placeholder || 'Search'}
        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E0DED8] bg-white text-sm outline-none focus:border-[#E8611A] focus:ring-2 focus:ring-[#E8611A]/10 transition-all"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
