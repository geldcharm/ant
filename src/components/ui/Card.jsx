export function Card({ children, className = '', onClick, hover = false, style }) {
  const interactive = hover ? 'hover:shadow-md cursor-pointer transition-all duration-200' : '';
  return (
    <div
      onClick={onClick}
      style={style}
      className={`bg-white rounded-2xl border border-[#E0DED8] ${interactive} ${className}`}
    >
      {children}
    </div>
  );
}
