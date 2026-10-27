import { useMemo, useState } from 'react';
import useResource from '../hooks/useResource';
import { listRecords } from '../services/campusService';
import ServiceCard from '../components/ServiceCard/ServiceCard';
import Icon from '../components/Icon/Icon';

const load = () => listRecords('services');
const normalize = (text = '') => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Services() {
  const { data, loading, error, reload } = useResource(load);
  const [search, setSearch] = useState('');

  const services = useMemo(() => {
    const term = normalize(search.trim());
    return (data || []).filter((service) => normalize(`${service.nombre} ${service.descripcion}`).includes(term));
  }, [data, search]);

  return (
    <section className="role-page services-view">
      <header className="services-view__hero">
        <div>
          <span className="panel__eyebrow">CATÁLOGO INSTITUCIONAL</span>
          <h1>Servicios del campus</h1>
          <p>Todo lo que puedes gestionar en Smart Campus, en un solo lugar. Elige un servicio para empezar.</p>
        </div>
        <div className="services-view__tools">
          <label className="services-view__search">
            <Icon name="search" size={18} />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar un servicio…" aria-label="Buscar servicios" />
          </label>
          <button className="button button--secondary services-view__refresh" onClick={reload} disabled={loading} aria-label="Actualizar catálogo" title="Actualizar catálogo">
            <Icon name="refresh" size={17} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="services-view__grid" aria-busy="true" aria-label="Cargando servicios">
          {[0, 1, 2, 3].map((index) => <div key={index} className="service-tile service-tile--skeleton" />)}
        </div>
      ) : error ? (
        <div className="services-view__state" role="alert">
          <Icon name="alert" size={26} />
          <h2>No fue posible cargar los servicios</h2>
          <p>{error}</p>
          <button className="button button--secondary" onClick={reload}>Reintentar</button>
        </div>
      ) : !data?.length ? (
        <div className="services-view__state">
          <Icon name="services" size={26} />
          <h2>Aún no hay servicios publicados</h2>
          <p>Cuando la administración publique servicios, aparecerán aquí.</p>
        </div>
      ) : !services.length ? (
        <div className="services-view__state">
          <Icon name="search" size={26} />
          <h2>Sin resultados para “{search.trim()}”</h2>
          <p>Prueba con otra palabra, por ejemplo “reservas” o “eventos”.</p>
          <button className="button button--secondary" onClick={() => setSearch('')}>Limpiar búsqueda</button>
        </div>
      ) : (
        <>
          <p className="services-view__count">{services.length} {services.length === 1 ? 'servicio disponible' : 'servicios disponibles'}</p>
          <div className="services-view__grid">
            {services.map((service) => (
              <ServiceCard key={service.id} service={{ id: service.id, code: service.codigo, name: service.nombre, description: service.descripcion, icon: service.icono }} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
