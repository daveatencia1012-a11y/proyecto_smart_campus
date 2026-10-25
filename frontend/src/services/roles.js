export const ROLE_LABELS = {
  estudiante: 'Estudiante', docente: 'Docente', administrativo: 'Administrativo', administrador: 'Administrador'
};
export const STAFF = ['administrativo', 'administrador'];
export const EVENT_EDITORS = ['docente', 'administrador'];
export const homeForRole = role => role === 'administrador' ? '/admin' : role === 'administrativo' ? '/gestion' : '/dashboard';
// Estas reglas solo controlan la presentación; el backend es la autoridad.
export const canEditEvent = (user, event) => user?.rol === 'administrador' || user?.rol === 'docente' && event.creado_por === user.id;
