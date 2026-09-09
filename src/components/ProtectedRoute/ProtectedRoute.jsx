import { Navigate, Outlet, useLocation } from "react-router-dom";

function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("uniajs-smart-campus-auth") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = localStorage.getItem("uniajs-smart-campus-role") || "student";
  if (role === "admin" && !location.pathname.startsWith("/admin")) {
    return <Outlet />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
