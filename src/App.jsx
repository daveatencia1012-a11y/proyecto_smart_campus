import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import PQRS from "./pages/PQRS";
import Profile from "./pages/Profile";
import RequestDetail from "./pages/RequestDetail";
import Requests from "./pages/Requests";
import ReservationDetail from "./pages/ReservationDetail";
import Reservations from "./pages/Reservations";
import Resources from "./pages/Resources";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import AdminModule from "./pages/admin/AdminModule";
import AdminRoute from "./components/AdminRoute/AdminRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to={localStorage.getItem("uniajs-smart-campus-role") === "admin" ? "/admin" : "/dashboard"} replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminModule />} />
              <Route path="/admin/:module" element={<AdminModule />} />
            </Route>
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/requests/:id" element={<RequestDetail />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/reservations/:id" element={<ReservationDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/pqrs" element={<PQRS />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
