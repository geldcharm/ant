import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';

const NAV = [
  { to: '/',           label: 'Dashboard',  icon: '⬡',  adminOnly: true },
  { to: '/jobs',       label: 'Jobs',       icon: '📋', adminOnly: false },
  { to: '/quotes',     label: 'Quotes',     icon: '📝', adminOnly: true },
  { to: '/invoices',   label: 'Invoices',   icon: '🧾', adminOnly: true },
  { to: '/calendar',   label: 'Calendar',   icon: '📅', adminOnly: false },
  { to: '/employees',  label: 'Team',       icon: '👥', adminOnly: true },
  { to: '/timesheet',  label: 'Time Sheet', icon: '⏱️', adminOnly: true },
];

export default function Sidebar({ mobile, onClose }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const { role, setRole } = useRole();
  const isAdmin = role === 'admin';

  function switchRole(newRole) {
    setRole(newRole);
    // Redirect employee away from admin-only pages
    if (newRole === 'employee') {
      const adminPaths = ['/', '/employees', '/quotes', '/invoices', '/timesheet'];
      const isOnAdminPage = adminPaths.some(p => loc.pathname === p || loc.pathname.startsWith(p + '/')) || loc.pathname.includes('/new') || loc.pathname.includes('/edit');
      if (isOnAdminPage) navigate('/calendar');
    }
  }

  const visibleNav = NAV.filter(n => isAdmin || !n.adminOnly);

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

      {/* Role Switcher */}
      <div className="px-3 mb-2">
        <div className="flex gap-1 bg-[#F5F4F0] p-1 rounded-xl">
          <button
            onClick={() => switchRole('admin')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              isAdmin ? 'bg-white text-[#1A1A18] shadow-sm' : 'text-[#9E9E98] hover:text-[#6B6B66]'
            }`}
          >
            <span className="text-sm">🔑</span> Admin
          </button>
          <button
            onClick={() => switchRole('employee')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              !isAdmin ? 'bg-white text-[#1A1A18] shadow-sm' : 'text-[#9E9E98] hover:text-[#6B6B66]'
            }`}
          >
            <span className="text-sm">👷</span> Employee
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 mt-2">
        {visibleNav.map(({ to, label, icon }) => {
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
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdmin ? 'bg-[#E8611A]/10' : 'bg-[#6366F1]/10'}`}>
            <span className={`text-xs font-bold ${isAdmin ? 'text-[#E8611A]' : 'text-[#6366F1]'}`}>{isAdmin ? 'OW' : 'EM'}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#1A1A18]">{isAdmin ? 'Owner' : 'Employee'}</p>
            <p className="text-[10px] text-[#9E9E98]">{isAdmin ? 'Admin' : 'Crew Member'}</p>
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
