# Colección Postman — UAJS Smart Campus

Pruebas de la API del Entregable 2. Todas las peticiones pasan por el API Gateway (`http://localhost:3200`).

## Archivos
| Archivo | Contenido |
|---|---|
| `UAJS_Smart_Campus.postman_collection.json` | Peticiones organizadas por carpeta, cada una con sus pruebas automáticas |
| `Local.postman_environment.json` | Variables del entorno local (`baseUrl`, credenciales del admin, tokens) |

## Cómo usarla
1. Levantar el backend (`docker compose up -d` desde `backend/`) y comprobar que `http://localhost:3200/health` responde `ok`.
2. En Postman: **Import** → seleccionar los dos archivos `.json`.
3. Elegir el entorno **Local** (arriba a la derecha) y, en ese entorno, escribir la contraseña del administrador en `adminPassword`, columna **Current value**. Ese valor queda solo en tu Postman y **no se sube al repositorio**.
4. Clic derecho sobre la colección → **Run collection** y ejecutar en orden. La carpeta `01 · Auth` debe correr antes que las demás, porque guarda los tokens.
5. **No incluir** la carpeta `99 · T14` en la ejecución normal: es una prueba manual de servicio caído (ver su descripción).

Cada ejecución crea sus propios datos de prueba (estudiantes con correo único y un recurso con código único que se da de baja al final), así que la colección se puede repetir sin conflictos.

## Contenido actual
| Carpeta | Casos |
|---|---|
| 00 · Gateway | Health, rutas publicadas, ruta inexistente (404 JSON), CORS permitido y bloqueado |
| 01 · Auth | Login válido e inválido, refresh, registro válido, correo repetido (409) y datos inválidos (400) |
| 02 · Usuarios | Listar, consultar, actualizar y desactivar; permisos por rol (401 y 403); id inválido e inexistente |
| 03 · Solicitudes | T08 crear (REGISTRADA), datos inválidos (400), permisos (401 y 403), T09 avanzar sin responsable y saltar estados (409), asignar responsable y avanzar a EN_REVISION |
| 04 · PQRS | Crear, tipo y campos inválidos (400), saltar de estado (409), pasar a revisión y responder como staff, respuesta vacía (400), estudiante sin permiso (403), inexistente (404) |
| 05 · Reservas | T10 reserva válida, T11 solapada (409), contigua permitida, horas y fecha inválidas (400), recurso inexistente (404), cancelar y volver a reservar |
| 06 a 08 | Pendientes: Recursos y Eventos (SD2-19) y Notificaciones |
| 99 · T14 | Servicio de eventos detenido: el Gateway responde 502/504 controlado y `/health` 503 |

## Cómo agregar casos
Cada petición debe tener al menos una prueba en la pestaña **Tests** que verifique el código HTTP esperado. Incluir un caso válido y uno inválido por operación. Exportar la colección (**Export → v2.1**) y reemplazar el archivo de esta carpeta.
