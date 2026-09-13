import { Navigate, Outlet, useLocation } from "react-router-dom";

function AdminRoute() {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem("smart-campus-token");
  const role = localStorage.getItem("smart-campus-role") || "student";

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role !== "administrador") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
