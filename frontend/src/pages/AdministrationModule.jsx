import { useParams } from 'react-router-dom';
import RecordsPage from '../components/RecordsPage/RecordsPage';
import RolesOverview from './RolesOverview';
import InstitutionSettings from './InstitutionSettings';
import SystemMonitoring from './SystemMonitoring';
import OperationalReports from './OperationalReports';
export default function AdministrationModule() {
  const { module } = useParams();
  if (module === 'roles') return <RolesOverview />;
  if (module === 'settings') return <InstitutionSettings />;
  if (module === 'monitoring') return <SystemMonitoring />;
  if (module === 'analytics') return <OperationalReports />;
  const kinds = { users:'users', services:'services', requests:'requests', reservations:'reservations', resources:'resources', events:'events', pqrs:'pqrs' };
  if (kinds[module]) return <RecordsPage key={module} kind={kinds[module]} operational />;
  return <section className="role-page"><h1>Funcionalidad pendiente</h1><p>Este módulo no forma parte de la versión funcional actual. No se simulan operaciones de guardado.</p></section>;
}
