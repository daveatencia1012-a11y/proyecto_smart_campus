import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useTheme from '../hooks/useTheme';
import useLocalStorage from '../hooks/useLocalStorage';
import useSession from '../hooks/useSession';
import { logout } from '../services/authService';
export default function Settings() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useLocalStorage(`uajs-ui-${user.id}`, { compactMode:false, reducedMotion:false });
  useEffect(() => {
    document.documentElement.dataset.compact = preferences.compactMode ? 'true' : 'false';
    document.documentElement.dataset.reducedMotion = preferences.reducedMotion ? 'true' : 'false';
  }, [preferences]);
  return <section className="role-page"><h1>Preferencias personales</h1><p>Los datos operativos se guardan en el servidor. Solo estas preferencias visuales se conservan en este navegador.</p>
    <div className="panel role-configuration"><label>Tema<select value={theme} onChange={e => setTheme(e.target.value)}><option value="light">Claro</option><option value="dark">Oscuro</option></select></label>
      <label><input type="checkbox" checked={preferences.compactMode} onChange={e => setPreferences(current => ({ ...current, compactMode:e.target.checked }))}/> Vista compacta</label>
      <label><input type="checkbox" checked={preferences.reducedMotion} onChange={e => setPreferences(current => ({ ...current, reducedMotion:e.target.checked }))}/> Reducir animaciones</label>
      <Link to="/profile">Editar mi perfil</Link><Link to="/notifications">Mis notificaciones</Link>
      <button className="button button--secondary" onClick={() => { logout(); navigate('/login', { replace:true }); }}>Cerrar sesión</button>
    </div>
  </section>;
}
