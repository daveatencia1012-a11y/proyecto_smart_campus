import useResource from '../hooks/useResource';
import { listRecords } from '../services/campusService';
import ServiceCard from '../components/ServiceCard/ServiceCard';
const load = () => listRecords('services');
export default function Services() {
  const { data, loading, error, reload } = useResource(load);
  return <section className="role-page"><header className="role-page__heading"><div><h1>Servicios del campus</h1><p>Catálogo institucional publicado por la administración.</p></div><button className="button button--secondary" onClick={reload}>Actualizar</button></header>
    {error && <p className="role-message" role="alert">{error}</p>}{loading && <p>Cargando…</p>}
    <div className="role-grid">{data?.map(service => <ServiceCard key={service.id} service={{ ...service, name:service.nombre, description:service.descripcion, icon:service.icono }}/>)}</div>
    {!loading && !error && !data?.length && <p>No hay servicios publicados.</p>}
  </section>;
}
