import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useRole, ROLES } from '../auth/RoleContext';
import { BUSINESS } from '../config/business';

const NAV = [
  { to: '/',           label: 'Dashboard',  icon: '⬡',  adminOnly: true  },
  { to: '/jobs',       label: 'Jobs',       icon: '📋', adminOnly: false },
  { to: '/quotes',     label: 'Quotes',     icon: '📝', adminOnly: true  },
  { to: '/invoices',   label: 'Invoices',   icon: '🧾', adminOnly: true  },
  { to: '/calendar',   label: 'Calendar',   icon: '📅', adminOnly: false },
  { to: '/employees',  label: 'Team',       icon: '👥', adminOnly: true  },
  { to: '/timesheet',  label: 'Time Sheet', icon: '⏱️', adminOnly: true  },
];

const ADMIN_PATH_PREFIXES = ['/', '/employees', '/quotes', '/invoices', '/timesheet'];

export default function Sidebar({ mobile, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, setRole, isAdmin } = useRole();

  function switchRole(newRole) {
    setRole(newRole);
    if (newRole !== ROLES.EMPLOYEE) return;

    const path = location.pathname;
    const onAdminPage =
      ADMIN_PATH_PREFIXES.some(p => path === p || path.startsWith(p + '/')) ||
      path.includes('/new') ||
      path.includes('/edit');
    if (onAdminPage) navigate('/calendar');
  }

  const visibleNav = NAV.filter(n => isAdmin || !n.adminOnly);

  const content = (
    <div className="flex flex-col h-full">
      <header className="px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#E8611A] flex items-center justify-center">
          <span className="text-white font-bold text-sm">{BUSINESS.shortCode}</span>
        </div>
        <div>
          <p className="font-bold text-[#1A1A18] text-sm leading-none">{BUSINESS.name}</p>
          <p className="text-[10px] text-[#9E9E98] mt-0.5">{BUSINESS.tagline}</p>
        </div>
      </header>

      <RoleSwitcher role={role} onSwitch={switchRole} />

      <nav className="flex-1 px-3 space-y-0.5 mt-2">
        {visibleNav.map(({ to, label, icon }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
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
              <span className="text-base" aria-hidden="true">{icon}</span>
              {label}
            </NavLink>
          );
        })}
      </nav>

      <UserFooter isAdmin={isAdmin} />
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

function RoleSwitcher({ role, onSwitch }) {
  const isAdmin = role === ROLES.ADMIN;
  return (
    <div className="px-3 mb-2">
      <div className="flex gap-1 bg-[#F5F4F0] p-1 rounded-xl">
        <RoleButton
          active={isAdmin}
          icon="🔑"
          label="Admin"
          onClick={() => onSwitch(ROLES.ADMIN)}
        />
        <RoleButton
          active={!isAdmin}
          icon="👷"
          label="Employee"
          onClick={() => onSwitch(ROLES.EMPLOYEE)}
        />
      </div>
    </div>
  );
}

function RoleButton({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all ${
        active ? 'bg-white text-[#1A1A18] shadow-sm' : 'text-[#9E9E98] hover:text-[#6B6B66]'
      }`}
    >
      <span className="text-sm" aria-hidden="true">{icon}</span> {label}
    </button>
  );
}

function UserFooter({ isAdmin }) {
  return (
    <div className="px-4 py-5 border-t border-[#E0DED8]">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdmin ? 'bg-[#E8611A]/10' : 'bg-[#6366F1]/10'}`}>
          <span className={`text-xs font-bold ${isAdmin ? 'text-[#E8611A]' : 'text-[#6366F1]'}`}>
            {isAdmin ? 'OW' : 'EM'}
          </span>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#1A1A18]">{isAdmin ? 'Owner' : 'Employee'}</p>
          <p className="text-[10px] text-[#9E9E98]">{isAdmin ? 'Admin' : 'Crew Member'}</p>
        </div>
      </div>
    </div>
  );
}
