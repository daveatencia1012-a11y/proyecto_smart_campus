import { Navigate, Outlet, useLocation } from "react-router-dom";
import useSession from "../../hooks/useSession";
import { homeForRole } from "../../services/roles";

function AdminRoute() {
  const location = useLocation();
  const { isAuthenticated, isAdmin, role } = useSession();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return <Navigate to={homeForRole(role)} replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
