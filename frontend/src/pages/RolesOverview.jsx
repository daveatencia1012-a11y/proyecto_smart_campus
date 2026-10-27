import { useMemo, useState } from 'react';
import Icon from '../components/Icon/Icon';
import useResource from '../hooks/useResource';
import { get } from '../services/api';
import { listRecords } from '../services/campusService';
import { ROLE_LABELS } from '../services/roles';

const ROLE_INFO = {
  estudiante: { icon: 'profile', description: 'Registra solicitudes y PQRS, reserva recursos y consulta eventos y notificaciones.' },
  docente: { icon: 'presentation', description: 'Lo mismo que el estudiante, y además publica y gestiona sus propios eventos.' },
  administrativo: { icon: 'building', description: 'Atiende solicitudes y PQRS, gestiona reservas, administra recursos y consulta reportes.' },
  administrador: { icon: 'shield', description: 'Administra usuarios, roles, servicios y configuración, y supervisa el sistema.' },
};
const MODULES = [
  ['usuarios', 'Usuarios'], ['solicitudes', 'Solicitudes'], ['pqrs', 'PQRS'], ['reservas', 'Reservas'],
  ['recursos', 'Recursos'], ['eventos', 'Eventos'], ['notificaciones', 'Notificaciones'], ['servicios', 'Servicios'],
  ['configuracion', 'Configuración'], ['reportes', 'Reportes'], ['roles', 'Roles'], ['permisos', 'Permisos'], ['monitoring', 'Estado del sistema'],
];
const ACTIONS = [['crear', 'Crear'], ['leer', 'Consultar'], ['actualizar', 'Actualizar'], ['eliminar', 'Eliminar']];
const SCOPES = {
  todos: 'Todos', propio: 'Solo lo propio', disponibles: 'Disponibles', visibles: 'Visibles',
  institucional: 'Institucional', operativo: 'Operativo',
};

const load = async () => {
  const [roles, permissions] = await Promise.all([get('/api/roles'), get('/api/permisos')]);
  return { roles: roles.roles, permisos: permissions.permisos };
};
const loadUsers = () => listRecords('users');

export default function RolesOverview() {
  const { data, loading, error, reload } = useResource(load);
  const { data: users } = useResource(loadUsers);
  const [selected, setSelected] = useState('administrador');

  const byRole = useMemo(() => {
    const map = {};
    for (const permission of data?.permisos || []) {
      map[permission.rol] ??= {};
      map[permission.rol][`${permission.recurso}:${permission.accion}`] = permission.alcance;
    }
    return map;
  }, [data]);

  const activeUsers = (role) => users ? users.filter((user) => user.rol === role && user.activo).length : null;
  const permissions = byRole[selected] || {};
  const modules = MODULES.filter(([key]) => ACTIONS.some(([action]) => permissions[`${key}:${action}`]));

  return (
    <section className="role-page roles-view">
      <header className="roles-view__heading">
        <div>
          <span className="panel__eyebrow">SISTEMA</span>
          <h1>Roles y permisos</h1>
          <p>El sistema maneja cuatro roles fijos. Selecciona uno para ver qué puede hacer en cada módulo. Los permisos se aplican en el backend; esta vista es de consulta.</p>
        </div>
        <button className="button button--secondary" onClick={reload} disabled={loading}>
          <Icon name="refresh" size={16} /> Actualizar
        </button>
      </header>

      {error && <p className="role-message" role="alert">{error}</p>}
      {loading && !data && <p className="roles-view__loading">Cargando roles…</p>}

      {data && (
        <>
          <div className="roles-view__cards" role="tablist" aria-label="Roles del sistema">
            {data.roles.map((role) => {
              const count = Object.keys(byRole[role] || {}).length;
              const people = activeUsers(role);
              return (
                <button
                  key={role}
                  type="button"
                  role="tab"
                  aria-selected={selected === role}
                  className={`roles-view__card ${selected === role ? 'is-selected' : ''}`}
                  onClick={() => setSelected(role)}
                >
                  <span className="roles-view__card-icon"><Icon name={ROLE_INFO[role]?.icon || 'profile'} size={20} /></span>
                  <strong>{ROLE_LABELS[role]}</strong>
                  <small>{ROLE_INFO[role]?.description}</small>
                  <span className="roles-view__stats">
                    <span>{count} permisos</span>
                    {people !== null && <span>{people} {people === 1 ? 'usuario activo' : 'usuarios activos'}</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <article className="panel roles-view__matrix" role="tabpanel">
            <div className="roles-view__matrix-head">
              <div>
                <span className="panel__eyebrow">PERMISOS</span>
                <h2>{ROLE_LABELS[selected]}</h2>
              </div>
              <ul className="roles-view__legend" aria-label="Alcance">
                <li><span className="roles-view__scope roles-view__scope--todos">Todos</span> cualquier registro</li>
                <li><span className="roles-view__scope roles-view__scope--propio">Solo lo propio</span> lo que creó el usuario</li>
                <li><span className="roles-view__none">—</span> sin acceso</li>
              </ul>
            </div>
            <div className="roles-view__table-wrap">
              <table className="roles-view__table">
                <thead>
                  <tr><th scope="col">Módulo</th>{ACTIONS.map(([key, label]) => <th key={key} scope="col">{label}</th>)}</tr>
                </thead>
                <tbody>
                  {modules.map(([key, label]) => (
                    <tr key={key}>
                      <th scope="row">{label}</th>
                      {ACTIONS.map(([action]) => {
                        const scope = permissions[`${key}:${action}`];
                        return (
                          <td key={action}>
                            {scope
                              ? <span className={`roles-view__scope roles-view__scope--${scope}`}><Icon name="check" size={13} /> {SCOPES[scope] || scope}</span>
                              : <span className="roles-view__none" aria-label="Sin acceso">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      )}
    </section>
  );
}
