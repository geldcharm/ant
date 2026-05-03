import { Navigate } from 'react-router-dom';
import { useRole } from './RoleContext';

// Route guard. Redirects users without the required role to /calendar
// (the only page non-admins can see today). When real auth lands, swap
// this for a server-side check.
export function RequireRole({ role, children }) {
  const { role: current } = useRole();
  if (current !== role) return <Navigate to="/calendar" replace />;
  return children;
}
