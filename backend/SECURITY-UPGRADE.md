# Aplicar B-001 a B-012

Los cambios de código no migran automáticamente una base existente. No borrar
el volumen MySQL ni usar `down -v`. Antes de actualizar: copia de seguridad y
ventana de mantenimiento para evitar escritores con el protocolo antiguo.

## 1. Configuración manual

Editar manualmente `backend/.env`, sin sobrescribirlo ni compartirlo:

- `JWT_SECRET`: `openssl rand -hex 32`.
- `JWT_REFRESH_SECRET`: otra clave distinta generada con el mismo comando.
- `INTERNAL_API_TOKEN`: otra clave para las notificaciones internas.
- `MYSQL_ROOT_PASSWORD`: contraseña root **actual** del volumen existente.
  Cambiar una variable no cambia la contraseña guardada por MySQL.
- `USERS_DB_PASSWORD`, `REQUESTS_DB_PASSWORD`, `RESERVATIONS_DB_PASSWORD`,
  `RESOURCES_DB_PASSWORD`, `EVENTS_DB_PASSWORD`, `NOTIFICATIONS_DB_PASSWORD`:
  generar por separado con `openssl rand -hex 32`. Deben ser 64 caracteres
  hexadecimales y todas diferentes, también distintas de root.

Las herramientas del repositorio no leen ni modifican `.env` salvo autorización
explícita del operador. Compose lo utiliza al desplegar por decisión del
operador. No compartir `compose config`, `docker inspect` o logs que puedan
contener credenciales.

## 2. Volumen existente

Desde `backend/`, después del respaldo:

```bash
docker compose stop gateway users-service requests-service reservations-service resources-service events-service notifications-service
docker compose up -d --wait mysql
docker compose exec -T mysql bash /docker-entrypoint-initdb.d/zz-app-users.sh
docker compose exec -T mysql bash -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --protocol=socket --user=root < /migrations/001-calendar.sql'
docker compose exec -T mysql bash -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --protocol=socket --user=root < /migrations/002-role-interfaces.sql'
docker compose exec -T mysql bash -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --protocol=socket --user=root < /migrations/003-actualizado-en.sql'
```

El primer script crea/reconfigura seis cuentas reservadas `campus_*` con CRUD
únicamente sobre su propia base. No concede DDL ni acceso a otras bases. Se
necesitan esas mismas variables al volver a aprovisionar/rotar las contraseñas.

La migración 001 crea la tabla de exclusión mutua y los índices de calendario.
La migración 002 es aditiva e igualmente reejecutable: crea la configuración
institucional y el catálogo de servicios, añade el alcance informativo a
`permisos`, agrega `recursos.eliminado_en` para la baja lógica y deja
`reservas.estado` con valor por defecto `confirmada`. No confirma reservas
antiguas en estado `pendiente` ni borra registros. Revisar y aprobar esas
reservas antiguas manualmente antes de operar con normalidad. Las entradas
legadas `disponibilidad.tipo='reserva'` se conservan y siguen bloqueando; la API
ya no permite crear entradas nuevas de ese tipo.

La migración 003 también es aditiva y reejecutable: agrega `actualizado_en`
(fecha de la última modificación) a `users`, `pqrs`, `reservas`, `recursos` y
`eventos`, y la restricción `CHECK (hora_fin > hora_inicio)` a `reservas` y
`disponibilidad`. `solicitudes` ya registraba esa fecha en `fecha_actualizacion`.

Las migraciones se ejecutan con el usuario root únicamente desde la consola
del contenedor; las cuentas `campus_*` no reciben DDL.

El usuario inicial `admin@uniajs.edu.co` conserva una contraseña de
demostración definida en `init.sql`. Cámbiala desde la interfaz de usuarios (o
con `PUT /api/usuarios/:id`) antes de exponer el sistema y no reutilices esa
cuenta para la operación diaria.

## 3. Volumen nuevo

El entrypoint oficial de MySQL ejecuta `init.sql`, después la migración 002 y
por último `zz-app-users.sh`. No se necesita aplicar nada a mano en un volumen
nuevo. En un volumen existente sí deben ejecutarse las migraciones 001, 002 y
003, en ese orden, con los comandos del apartado anterior.

## 4. Desplegar y verificar

```bash
docker compose up -d --build
```

Solo el gateway publica el puerto 3200. MySQL y los servicios se comunican por
la red interna de Compose; para consultas administrativas utilizar `compose
exec mysql`, no volver a abrir puertos externos. El gateway ya no recibe el
archivo `.env` completo y su imagen copia únicamente `src` y dependencias de
producción. Retirar imágenes antiguas que contuvieran secretos y rotar cualquier
credencial distribuida con ellas; reconstruir no limpia capas antiguas.

- Iniciar sesión nuevamente: los tokens anteriores no incluyen los nuevos
  claims de finalidad/emisor/audiencia y se rechazan.
- Un refresh como Bearer y un access en `/api/auth/refresh` deben dar 401.
- Los cuatro roles conservan su RBAC; un estudiante no puede cambiar su rol
  ni inyectarlo dentro de `nombre` como objeto JSON.
- Eventos privados: solo su autor y el administrador pueden leerlos. El
  administrativo consulta eventos públicos; no crea, edita ni elimina eventos.
- Reservar un recurso con `disponible=0` debe dar 409.
- Reservas, cambios de fecha/horas, cancelaciones y bloqueos comparten
  transacciones con bloqueos recurso/fecha. Dos operaciones incompatibles no
  pueden aprobarse a la vez. Horarios adyacentes sí se permiten.
- Disponibilidad devuelve ocupación de ambas tablas, sin datos del propietario,
  y añade `fuente` para distinguir IDs de orígenes diferentes.
- Login: 20 intentos/IP/15 min; refresh: 30/IP/min. Después, 429.
- Llamadas internas: máximo 5 s y sin reintentos de escritura. Proxy: 15 s de
  inactividad; health agregado en paralelo con plazo de 2 s.

Las notificaciones siguen siendo de mejor esfuerzo: un fallo no revierte una
operación confirmada y se registra, pero no existe reentrega persistente. La
consulta HTTP de estado/disponibilidad de un recurso tampoco es una transacción
distribuida; para mantenimientos programados deben crearse bloqueos de calendario.

## 5. Interfaces por rol

La autorización sigue en las rutas y controladores de cada servicio; la tabla
`permisos` y la pantalla de roles son **informativas** y no conceden acceso.

| Rol | Alcance funcional |
| --- | --- |
| `estudiante` | Sus solicitudes, PQRS, reservas y notificaciones; catálogo, recursos, eventos públicos, calendario y perfil propio. |
| `docente` | Todo lo anterior, más crear y editar sus propios eventos. |
| `administrativo` | Atención de solicitudes y PQRS, gestión de reservas y recursos, reportes operativos y consulta de eventos. No administra usuarios, roles ni configuración. |
| `administrador` | Gestión global, usuarios/roles, catálogo de servicios, configuración institucional, monitoreo y baja de eventos. |

Rutas nuevas del gateway: `/api/permisos`, `/api/configuracion` y
`/api/servicios`. Los conteos de dashboard usan endpoints agregados
(`/mis/conteo`, `/conteo`, `/por-fecha`) en lugar de sumar listados truncados.
Las reservas nuevas se confirman automáticamente si el recurso está disponible y
el horario libre; los estados `pendiente` heredados se conservan.

En el frontend, `/gestion` y sus módulos son exclusivos de
`administrativo`/`administrador`; `/admin` es exclusivo de `administrador`. El
guard de rutas solo evita mostrar pantallas: el backend vuelve a comprobar rol y
propiedad en cada petición. Los datos operativos ya no se guardan en
`localStorage`; solo las preferencias visuales permanecen en el navegador.

## Pruebas y reversión

```bash
pnpm --dir backend install --frozen-lockfile
pnpm --dir backend test
```

No usan el `.env` real. Las pruebas de MySQL se habilitan explícitamente con
`pnpm --dir backend run test:mysql` y crean un contenedor efímero separado, con
datos y claves sintéticos; no usan el volumen del proyecto. Esa suite incluye
`roles-http.test.mjs`, que levanta el gateway y los seis servicios reales contra
MySQL y prueba los cuatro roles de extremo a extremo (propiedad, transiciones,
eventos, PQRS, reservas, recursos, catálogo y configuración).

Revertir solo los cambios de esta fase, sin descartar trabajo ajeno. Las tablas
e índices añadidos pueden permanecer mientras se investiga un fallo. No mezclar
instancias antiguas y nuevas: el código antiguo no respeta los bloqueos. No
restaurar secretos expuestos ni la cuenta root en los servicios para resolver
un problema de configuración.
