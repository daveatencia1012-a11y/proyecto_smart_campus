import { Navigate, Outlet } from 'react-router-dom';
import useSession from '../../hooks/useSession';
import { homeForRole } from '../../services/roles';

export default function RoleRoute({ roles }) {
  const { isAuthenticated, role } = useSession();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <Navigate to={homeForRole(role)} replace />;
  return <Outlet />;
}
