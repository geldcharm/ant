import { BackButton } from './BackButton';

export function PageHeader({ title, subtitle, backTo, actions, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <BackButton to={backTo} />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#1A1A18] truncate">{title}</h1>
          {subtitle && <p className="text-sm text-[#9E9E98] mt-0.5">{subtitle}</p>}
          {children}
        </div>
      </div>
      {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
