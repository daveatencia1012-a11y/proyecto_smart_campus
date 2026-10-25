import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar/Sidebar";
import InstitutionProvider from '../components/InstitutionProvider/InstitutionProvider';
import useSession from '../hooks/useSession';

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, role } = useSession();

  const closeSidebar = () => setIsSidebarOpen(false);

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
