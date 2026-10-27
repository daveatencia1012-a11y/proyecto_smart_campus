import { useEffect } from 'react';
import Icon from '../components/Icon/Icon';
import useResource from '../hooks/useResource';
import { get } from '../services/api';

const REFRESH_SECONDS = 30;
const COMPONENTS = [
  { key: 'gateway', name: 'API Gateway', service: 'api-gateway', icon: 'layout', description: 'Punto de entrada único: enruta las peticiones a cada servicio.' },
  { key: 'users', name: 'Usuarios', service: 'users-service', icon: 'profile', description: 'Autenticación, usuarios, roles, configuración y dashboard.' },
  { key: 'requests', name: 'Solicitudes', service: 'requests-service', icon: 'requests', description: 'Solicitudes académicas y PQRS con su ciclo de estados.' },
  { key: 'reservations', name: 'Reservas', service: 'reservations-service', icon: 'reservations', description: 'Reservas de espacios y validación de disponibilidad.' },
  { key: 'resources', name: 'Recursos', service: 'resources-service', icon: 'resources', description: 'Inventario de salas, laboratorios, equipos y catálogo de servicios.' },
  { key: 'events', name: 'Eventos', service: 'events-service', icon: 'events', description: 'Agenda de eventos académicos e institucionales.' },
  { key: 'notifications', name: 'Notificaciones', service: 'notifications-service', icon: 'notifications', description: 'Avisos a los usuarios por cambios en sus trámites.' },
];
const STATUS = {
  ok: { label: 'Operativo', detail: 'Responde correctamente' },
  error: { label: 'Con errores', detail: 'Respondió con un error' },
  offline: { label: 'Sin respuesta', detail: 'No respondió a tiempo' },
};

// Se mide cuánto tarda la comprobación completa (frontend → gateway → servicios).
const load = async () => {
  const started = performance.now();
  const data = await get('/api/dashboard/salud');
  return { ...data, duracion: Math.round(performance.now() - started) };
};

function statusOf(data, key) {
  const value = key === 'gateway' ? data.gateway : data.services?.[key];
  return STATUS[value] ? value : value ? 'error' : 'offline';
}

export default function SystemMonitoring() {
  const { data, loading, error, reload } = useResource(load);

  // Comprobación automática periódica, solo mientras la pestaña está visible.
  useEffect(() => {
    const timer = window.setInterval(() => { if (!document.hidden) reload(); }, REFRESH_SECONDS * 1000);
    return () => window.clearInterval(timer);
  }, [reload]);

  const statuses = data ? COMPONENTS.map(({ key }) => statusOf(data, key)) : [];
  const healthy = statuses.filter((status) => status === 'ok').length;
  const overall = !data ? null : healthy === COMPONENTS.length ? 'ok' : healthy === 0 ? 'offline' : 'error';
  const checkedAt = data ? new Date(data.consultado_en).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'medium' }) : '';

  return (
    <section className="role-page system-view">
      <header className="system-view__heading">
        <div>
          <span className="panel__eyebrow">ADMINISTRACIÓN</span>
          <h1>Estado del sistema</h1>
          <p>Resultado de los healthchecks del API Gateway y los seis microservicios. Muestra el estado actual, no un porcentaje histórico de disponibilidad.</p>
        </div>
        <button className="button button--secondary system-view__refresh" onClick={reload} disabled={loading}>
          <Icon name="refresh" size={16} className={loading ? 'system-view__spin' : undefined} />
          {loading ? 'Comprobando…' : 'Comprobar ahora'}
        </button>
      </header>

      {error ? (
        <div className="system-view__banner system-view__banner--offline" role="alert">
          <span className="system-view__banner-icon"><Icon name="alert" size={22} /></span>
          <div>
            <strong>No fue posible consultar el estado del sistema</strong>
            <p>{error}</p>
          </div>
          <button className="button button--secondary" onClick={reload}>Reintentar</button>
        </div>
      ) : (
        <div className={`system-view__banner system-view__banner--${overall || 'loading'}`} role="status" aria-live="polite">
          <span className="system-view__banner-icon">
            <Icon name={overall === 'ok' ? 'checkCircle' : overall ? 'alert' : 'refresh'} size={22} className={overall ? undefined : 'system-view__spin'} />
          </span>
          <div>
            <strong>
              {!overall ? 'Consultando los servicios…'
                : overall === 'ok' ? 'Todos los componentes están operativos'
                : `${COMPONENTS.length - healthy} de ${COMPONENTS.length} componentes con incidencias`}
            </strong>
            <p>{overall ? `Última comprobación: ${checkedAt} · Tiempo de respuesta: ${data.duracion} ms` : 'Esto toma solo unos segundos.'}</p>
          </div>
          {overall && (
            <div className="system-view__score" aria-label={`${healthy} de ${COMPONENTS.length} operativos`}>
              <strong>{healthy}<span>/{COMPONENTS.length}</span></strong>
              <small>operativos</small>
            </div>
          )}
        </div>
      )}

      <div className="system-view__grid">
        {COMPONENTS.map((component, index) => {
          const status = data ? statuses[index] : null;
          return (
            <article key={component.key} className={`system-view__card${status ? ` system-view__card--${status}` : ' system-view__card--loading'}${component.key === 'gateway' ? ' system-view__card--gateway' : ''}`}>
              <div className="system-view__card-top">
                <span className="system-view__card-icon"><Icon name={component.icon} size={20} /></span>
                {status ? (
                  <span className={`system-view__badge system-view__badge--${status}`}>
                    <i aria-hidden="true" />{STATUS[status].label}
                  </span>
                ) : (
                  <span className="system-view__badge system-view__badge--loading">{error ? 'Sin datos' : 'Comprobando…'}</span>
                )}
              </div>
              <div>
                <h2>{component.name}</h2>
                <code>{component.service}</code>
              </div>
              <p>{component.description}</p>
              <footer>{status ? STATUS[status].detail : error ? 'Estado desconocido' : 'Esperando respuesta'}</footer>
            </article>
          );
        })}
      </div>

      <p className="system-view__note">
        <Icon name="info" size={14} /> Se comprueba automáticamente cada {REFRESH_SECONDS} segundos mientras esta pestaña está abierta.
      </p>
    </section>
  );
}
