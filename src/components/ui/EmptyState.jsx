export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#F5F4F0] flex items-center justify-center text-[#9E9E98] text-2xl">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-[#1A1A18] text-sm">{title}</p>
        {subtitle && <p className="text-xs text-[#9E9E98] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
