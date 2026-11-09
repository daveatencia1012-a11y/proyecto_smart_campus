# Panel administrativo — UAJS Smart Campus

## Acceso

La autenticación es **real**: el formulario de login envía las credenciales al
backend (microservicio de usuarios), que valida la contraseña contra la base de
datos y devuelve un JWT. El rol del usuario queda guardado en la sesión y las
rutas del panel están protegidas por el componente `AdminRoute`: sin sesión o sin
rol `administrador` no se puede entrar.

- Cuentas de demostración creadas por `backend/sql/seed.sql` (contraseña
  `12345678`): `estudiante.demo@uniajs.edu.co`, `docente.demo@uniajs.edu.co`,
  `administrativo.demo@uniajs.edu.co`, entre otras.
- El usuario administrador inicial `admin@uniajs.edu.co` lo crea
  `backend/sql/init.sql` con una contraseña de demostración definida ahí.
- Al iniciar sesión se abre `/dashboard`; la sección **Administración** del
  sidebar solo aparece para el rol `administrador` y sus rutas viven bajo
  `/admin/:module` (por ejemplo `/admin/users`).

## Módulos del panel

| Ruta | Sección | Contenido |
|---|---|---|
| `/admin/analytics` | Analítica | Resumen de usuarios, solicitudes, reservas y recursos. |
| `/admin/users` | Usuarios | Listado, búsqueda, creación y edición de cuentas; activar y desactivar usuarios. |
| `/admin/roles` | Roles y permisos | Vista general de los roles del sistema y sus permisos. |
| `/admin/services` | Servicios | Alta y edición de los servicios del catálogo. |
| `/admin/events` | Eventos | Gestión de actividades académicas e institucionales. |
| `/admin/monitoring` | Estado del sistema | Healthchecks reales del API Gateway y de los seis microservicios. |
| `/admin/settings` | Configuración admin | Ajustes institucionales del campus. |

## Reglas de seguridad del módulo de usuarios

- Solo el administrador crea, edita, desactiva y reactiva cuentas.
- **Nadie puede desactivarse a sí mismo ni cambiarse el propio rol**: el
  backend responde `403` y la interfaz no ofrece esas opciones en la fila
  propia (ni el botón "Desactivar" ni los campos rol/estado al editar).
- La protección del último administrador activo evita dejar el sistema sin
  acceso administrativo.

## Funciones incluidas

- Panel de indicadores: solicitudes pendientes, reservas realizadas,
  notificaciones no leídas, eventos próximos y servicios disponibles.
- Cola de solicitudes con avance de estados.
- Gestión de usuarios ficticios: crear, editar, activar y desactivar.
- Gestión del estado de los recursos universitarios.
- Agenda de próximos eventos y calendario.
- Exportación CSV de los registros.
- Estado real del sistema y accesos a calendario y configuración.

Los datos mostrados son ficticios, generados por los scripts de siembra del
backend; no corresponden a personas reales.
