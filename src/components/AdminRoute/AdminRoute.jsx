import { Navigate, Outlet, useLocation } from "react-router-dom";

function AdminRoute() {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("uniajs-smart-campus-auth") === "true";
  const role = localStorage.getItem("uniajs-smart-campus-role") || "student";

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
