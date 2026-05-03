import { createContext, useContext, useState } from 'react';

export const ROLES = { ADMIN: 'admin', EMPLOYEE: 'employee' };

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [role, setRole] = useState(ROLES.ADMIN);
  return (
    <RoleContext.Provider value={{ role, setRole, isAdmin: role === ROLES.ADMIN }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside <RoleProvider>');
  return ctx;
}
