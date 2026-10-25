import { useParams } from 'react-router-dom';
import RecordsPage from '../components/RecordsPage/RecordsPage';
import OperationalReports from './OperationalReports';
export default function ManagementModule() {
  const { module } = useParams();
  const kinds = { solicitudes:'requests', reservas:'reservations', recursos:'resources', pqrs:'pqrs' };
  if (module === 'reportes') return <OperationalReports />;
  if (kinds[module]) return <RecordsPage key={module} kind={kinds[module]} operational />;
  return <section className="role-page"><h1>Módulo no disponible</h1><p>Esta funcionalidad no está implementada.</p></section>;
}
