import { Navigate, Outlet, useLocation } from "react-router-dom";
import useSession from '../../hooks/useSession';

function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated } = useSession();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
