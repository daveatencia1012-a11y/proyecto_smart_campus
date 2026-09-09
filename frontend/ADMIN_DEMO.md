# Panel administrativo — UAJS Smart Campus

## Acceso de demostración
El frontend académico identifica como administrador cualquier correo que empiece por `admin@` o contenga `admin` como segmento (por ejemplo, `admin@uniajs.edu.co`). La contraseña puede ser cualquiera que no esté vacía porque esta versión usa autenticación simulada.

Al iniciar sesión con un correo administrativo se abre automáticamente `/admin` y aparece la sección **Administración** en el sidebar.

> Esta lógica es únicamente para demostración del frontend. La autorización real debe implementarse posteriormente en el backend mediante JWT, roles y permisos.

## Funciones incluidas
- Resumen de usuarios, solicitudes, reservas y recursos.
- Salud simulada de API Gateway y microservicios.
- Cola de solicitudes con avance de estados.
- Gestión de usuarios ficticios: crear y activar/desactivar.
- Gestión visual del estado de recursos.
- Agenda de próximos eventos.
- Exportación CSV de solicitudes.
- Accesos a calendario y configuración.
