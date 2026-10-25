import useResource from '../hooks/useResource';
import { get } from '../services/api';
import { ROLE_LABELS } from '../services/roles';

const load = async () => {
  const [roles, permissions] = await Promise.all([get('/api/roles'), get('/api/permisos')]);
  return { roles:roles.roles, permisos:permissions.permisos };
};
export default function RolesOverview() {
  const { data, loading, error, reload } = useResource(load);
  return <section className="role-page"><header className="role-page__heading"><div><h1>Roles y permisos</h1><p>Catálogo informativo de los cuatro roles fijos. La autorización se aplica en las rutas y los controladores del backend.</p></div><button className="button button--secondary" onClick={reload}>Actualizar</button></header>
    {error && <p className="role-message" role="alert">{error}</p>}{loading && <p>Cargando…</p>}
    <div className="role-grid">{data?.roles.map(role => <article className="panel role-card" key={role}><h2>{ROLE_LABELS[role]}</h2><ul>{data.permisos.filter(permission => permission.rol === role).map(permission => <li key={permission.id}><strong>{permission.recurso}</strong>: {permission.accion} · {permission.alcance}</li>)}</ul></article>)}</div>
  </section>;
}
