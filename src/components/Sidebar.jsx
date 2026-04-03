import { NavLink, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/',           label: 'Dashboard',  icon: '⬡' },
  { to: '/jobs',       label: 'Jobs',       icon: '📋' },
  { to: '/calendar',  label: 'Calendar',   icon: '📅' },
  { to: '/employees', label: 'Team',        icon: '👥' },
];

export default function Sidebar({ mobile, onClose }) {
  const loc = useLocation();

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#E8611A] flex items-center justify-center">
          <span className="text-white font-bold text-sm">PM</span>
        </div>
        <div>
          <p className="font-bold text-[#1A1A18] text-sm leading-none">PaveMaster</p>
          <p className="text-[10px] text-[#9E9E98] mt-0.5">Field Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 mt-2">
        {NAV.map(({ to, label, icon }) => {
          const isActive = to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#E8611A] text-white shadow-sm'
                  : 'text-[#6B6B66] hover:bg-[#F5F4F0] hover:text-[#1A1A18]'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-5 border-t border-[#E0DED8]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E8611A]/10 flex items-center justify-center">
            <span className="text-[#E8611A] text-xs font-bold">OW</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#1A1A18]">Owner</p>
            <p className="text-[10px] text-[#9E9E98]">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <div className="fixed inset-0 z-50 flex" onClick={onClose}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative w-64 bg-white h-full shadow-2xl" onClick={e => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-r border-[#E0DED8] h-screen sticky top-0">
      {content}
    </aside>
  );
}
