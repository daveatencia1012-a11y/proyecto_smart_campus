import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar/Sidebar";
import InstitutionProvider from '../components/InstitutionProvider/InstitutionProvider';
import useSession from '../hooks/useSession';

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, role } = useSession();

  const closeSidebar = () => setIsSidebarOpen(false);

  // Aplica las preferencias de interfaz guardadas en Configuración al iniciar sesión.
  useEffect(() => {
    let preferences;
    try { preferences = JSON.parse(localStorage.getItem(`uajs-ui-${user?.id}`) || '{}'); } catch { preferences = {}; }
    document.documentElement.dataset.compact = preferences.compactMode ? 'true' : 'false';
    document.documentElement.dataset.reducedMotion = preferences.reducedMotion ? 'true' : 'false';
  }, [user?.id]);

  return (
    <InstitutionProvider key={`${user?.id}:${role}`}><div className="layout">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="layout__main">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div></InstitutionProvider>
  );
}

export default DashboardLayout;
