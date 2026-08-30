# Plan de Implementación: Microservicios Backend UAJS Smart Campus

## Arquitectura

- **Patrón:** Microservicios con bases de datos separadas (una instancia MySQL, múltiples bases de datos).
- **Framework:** Node.js + Express + MVC por servicio.
- **Auth:** JWT stateless.
- **Comunicación inter-servicio:** HTTP/REST vía `axios` o `fetch`.
- **Puertos sugeridos:**
  - users-service: 3201
  - requests-service: 3202
  - reservations-service: 3203
  - resources-service: 3204
  - events-service: 3205
  - notifications-service: 3206

---

## Estructura común por microservicio

```
backend/
├── services/
│   ├── users-service/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── db.js
│   │   │   ├── controllers/
│   │   │   ├── middleware/
│   │   │   │   └── auth.js
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── app.js
│   │   │   └── index.js
│   │   ├── package.json
│   │   └── dockerfile
│   ├── requests-service/
│   ├── reservations-service/
│   ├── resources-service/
│   ├── events-service/
│   └── notifications-service/
└── docker-compose.yml
```

---

## 1. users-service (puerto 3201)

### Base de datos: `users_db`

Tabla `users`:
- `id` INT PK AI
- `nombre` VARCHAR(100)
- `email` VARCHAR(100) UNIQUE
- `password_hash` VARCHAR(255)
- `rol` ENUM('estudiante', 'docente', 'administrativo', 'administrador')
- `activo` TINYINT(1) DEFAULT 1
- `creado_en` DATETIME DEFAULT CURRENT_TIMESTAMP

Tabla `permisos`:
- `id` INT PK AI
- `rol` ENUM(...)
- `recurso` VARCHAR(50)
- `accion` ENUM('crear', 'leer', 'actualizar', 'eliminar')

### Endpoints

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Registro de usuario (solo admin) |
| POST | `/api/auth/login` | No | Login, retorna JWT |
| POST | `/api/auth/refresh` | No | Refresh token |
| GET | `/api/usuarios` | Admin | Listar usuarios (paginado) |
| GET | `/api/usuarios/:id` | Admin/Owner | Obtener usuario por ID |
| PUT | `/api/usuarios/:id` | Admin/Owner | Actualizar usuario |
| DELETE | `/api/usuarios/:id` | Admin | Eliminar usuario (soft delete) |
| GET | `/api/roles` | Admin | Listar roles disponibles |
| GET | `/api/permisos` | Admin | Consultar permisos por rol |

### Middleware
- `auth.js`: Verifica JWT, adjunta `req.user`. Roles permitidos por ruta.

---

## 2. requests-service (puerto 3202)

### Base de datos: `requests_db`

Tabla `solicitudes`:
- `id` INT PK AI
- `usuario_id` INT (FK lógica a users-service)
- `tipo_servicio` VARCHAR(100)
- `dependencia` VARCHAR(100)
- `descripcion` TEXT
- `prioridad` ENUM('baja', 'media', 'alta', 'critica')
- `estado` ENUM('REGISTRADA', 'EN_REVISION', 'ASIGNADA', 'EN_PROCESO', 'RESUELTA', 'CERRADA') DEFAULT 'REGISTRADA'
- `responsable_id` INT (FK lógica a users-service)
- `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP
- `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- `historial` JSON (cambios de estado con fecha y usuario)

### Endpoints

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/solicitudes` | Autenticado | Crear solicitud |
| GET | `/api/solicitudes` | Autenticado | Listar solicitudes (filtro por estado, usuario, fecha) |
| GET | `/api/solicitudes/:id` | Owner/Admin | Obtener detalle y seguimiento |
| PUT | `/api/solicitudes/:id` | Admin/Responsable | Actualizar estado o datos |
| PUT | `/api/solicitudes/:id/estado` | Admin/Responsable | Cambiar estado (validar transiciones) |
| DELETE | `/api/solicitudes/:id` | Admin | Eliminar solicitud |

### Reglas de estado
- Transiciones permitidas:
  - REGISTRADA → EN_REVISION
  - EN_REVISION → ASIGNADA / REGISTRADA
  - ASIGNADA → EN_PROCESO / EN_REVISION
  - EN_PROCESO → RESUELTA / ASIGNADA
  - RESUELTA → CERRADA / EN_PROCESO
- Al cambiar estado, registrar en `historial` y disparar notificación a `notifications-service`.

---

## 3. reservations-service (puerto 3203)

### Base de datos: `reservations_db`

Tabla `reservas`:
- `id` INT PK AI
- `usuario_id` INT
- `recurso_id` INT (FK lógica a resources-service)
- `fecha` DATE
- `hora_inicio` TIME
- `hora_fin` TIME
- `estado` ENUM('confirmada', 'cancelada', 'pendiente') DEFAULT 'pendiente'
- `motivo_cancelacion` TEXT NULL
- `creado_en` DATETIME DEFAULT CURRENT_TIMESTAMP

Tabla `disponibilidad` (opcional, para bloquear horarios):
- `id` INT PK AI
- `recurso_id` INT
- `fecha` DATE
- `hora_inicio` TIME
- `hora_fin` TIME
- `tipo` ENUM('reserva', 'mantenimiento', 'bloqueo')

### Endpoints

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/reservas` | Autenticado | Crear reserva (validar disponibilidad) |
| GET | `/api/reservas` | Autenticado | Listar reservas (filtro por usuario, recurso, fecha) |
| GET | `/api/reservas/:id` | Owner/Admin | Detalle de reserva |
| PUT | `/api/reservas/:id` | Owner/Admin | Modificar reserva |
| PUT | `/api/reservas/:id/cancelar` | Owner/Admin | Cancelar reserva |
| GET | `/api/disponibilidad/:recurso_id` | Autenticado | Consultar disponibilidad por recurso y fecha |
| POST | `/api/disponibilidad` | Admin | Crear bloqueo/mantenimiento |

### Validaciones
- Solapamiento de horarios para el mismo recurso en la misma fecha.
- Recurso debe estar activo (consultar `resources-service`).
- Horario dentro de horario de operación si aplica.

---

## 4. resources-service (puerto 3204)

### Base de datos: `resources_db`

Tabla `recursos`:
- `id` INT PK AI
- `codigo` VARCHAR(50) UNIQUE
- `nombre` VARCHAR(100)
- `tipo` VARCHAR(50)
- `ubicacion` VARCHAR(100)
- `estado` ENUM('disponible', 'en_mantenimiento', 'fuera_servicio')
- `disponible` TINYINT(1) DEFAULT 1
- `descripcion` TEXT NULL
- `creado_en` DATETIME DEFAULT CURRENT_TIMESTAMP

### Endpoints

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/recursos` | Admin | Crear recurso |
| GET | `/api/recursos` | Autenticado | Listar recursos (filtro por tipo, estado, disponibilidad) |
| GET | `/api/recursos/:id` | Autenticado | Obtener recurso |
| PUT | `/api/recursos/:id` | Admin | Actualizar recurso |
| PUT | `/api/recursos/:id/disponibilidad` | Admin | Cambiar disponibilidad |
| DELETE | `/api/recursos/:id` | Admin | Eliminar recurso (soft delete) |
| GET | `/api/tipos` | Autenticado | Listar tipos de recursos únicos |

---

## 5. events-service (puerto 3205)

### Base de datos: `events_db`

Tabla `eventos`:
- `id` INT PK AI
- `nombre` VARCHAR(150)
- `descripcion` TEXT
- `fecha` DATE
- `hora` TIME
- `lugar` VARCHAR(100)
- `tipo` ENUM('academico', 'institucional', 'cultural', 'deportivo', 'otro')
- `creado_por` INT (FK lógica a users-service)
- `publico` TINYINT(1) DEFAULT 1
- `creado_en` DATETIME DEFAULT CURRENT_TIMESTAMP

### Endpoints

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/eventos` | Admin/Docente | Crear evento |
| GET | `/api/eventos` | Autenticado | Listar eventos (filtro por fecha, tipo) |
| GET | `/api/eventos/:id` | Autenticado | Obtener evento |
| PUT | `/api/eventos/:id` | Admin/Creador | Actualizar evento |
| DELETE | `/api/eventos/:id` | Admin | Eliminar evento |
| GET | `/api/eventos/proximos` | Autenticado | Próximos eventos (ej. próximos 30 días) |
| GET | `/api/tipos-evento` | Autenticado | Listar tipos de evento |

---

## 6. notifications-service (puerto 3206)

### Base de datos: `notifications_db`

Tabla `notificaciones`:
- `id` INT PK AI
- `usuario_id` INT
- `titulo` VARCHAR(150)
- `mensaje` TEXT
- `tipo` ENUM('solicitud', 'reserva', 'evento', 'sistema', 'pqrs')
- `referencia_id` INT NULL (id del recurso relacionado)
- `referencia_tipo` VARCHAR(50) NULL ('solicitud', 'reserva', etc.)
- `leida` TINYINT(1) DEFAULT 0
- `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP

### Endpoints

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/notificaciones` | Interno/Sistema | Crear notificación (usado por otros servicios) |
| GET | `/api/notificaciones` | Autenticado | Listar notificaciones del usuario autenticado |
| GET | `/api/notificaciones/no-leidas` | Autenticado | Contar notificaciones no leídas |
| PUT | `/api/notificaciones/:id/leer` | Owner | Marcar como leída |
| PUT | `/api/notificaciones/marcar-todas` | Autenticado | Marcar todas como leídas |
| DELETE | `/api/notificaciones/:id` | Owner | Eliminar notificación |

### Eventos que disparan notificaciones
- `requests-service`: cambio de estado de solicitud.
- `reservations-service`: confirmación/cancelación de reserva.
- `events-service`: creación de nuevo evento.
- Sistema: comunicados generales.

---

## 7. PQRS (dentro de requests-service)

Tabla `pqrs`:
- `id` INT PK AI
- `usuario_id` INT
- `tipo` ENUM('peticion', 'queja', 'reclamo', 'sugerencia')
- `asunto` VARCHAR(150)
- `descripcion` TEXT
- `estado` ENUM('registrada', 'en_revision', 'respondida', 'cerrada') DEFAULT 'registrada'
- `respuesta` TEXT NULL
- `creado_en` DATETIME DEFAULT CURRENT_TIMESTAMP

### Endpoints

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/pqrs` | Autenticado | Crear PQRS |
| GET | `/api/pqrs` | Admin | Listar PQRS (filtro por tipo, estado) |
| GET | `/api/pqrs/:id` | Owner/Admin | Detalle y seguimiento |
| PUT | `/api/pqrs/:id` | Admin | Actualizar estado / responder |
| DELETE | `/api/pqrs/:id` | Admin | Eliminar PQRS |

---

## 8. Dashboard (agregado sobre users-service o nuevo endpoints agregados)

Endpoints de estadísticas (protegidos, rol admin):

| Method | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/dashboard/solicitudes-pendientes` | Admin | Conteo por estado |
| GET | `/api/dashboard/reservas-realizadas` | Admin | Conteo por fecha/día |
| GET | `/api/dashboard/notificaciones-no-leidas` | Admin | Conteo global |
| GET | `/api/dashboard/proximos-eventos` | Autenticado | Próximos 7 días |
| GET | `/api/dashboard/servicios-disponibles` | Autenticado | Recursos disponibles ahora |
| GET | `/api/dashboard/estadisticas-generales` | Admin | Resumen agregado |

**Nota:** El dashboard puede consultar a los otros servicios o tener tablas materializadas/consultas distribuidas. Para MVP, llamar a cada servicio y agregar.

---

## Middleware y seguridad común

- `auth.js`: Verifica header `Authorization: Bearer <token>`. Decodifica JWT, adjunta `req.user = { id, rol, email }`.
- `roleCheck(allowedRoles)`: Verifica que `req.user.rol` esté en la lista.
- `errorHandler`: Captura errores, logging, respuesta JSON consistente.
- `validateInput`: Body parsing y validación básica.

---

## Flujos inter-servicio críticos

1. **Reserva → Validar recurso:** `reservations-service` llama a `resources-service GET /api/recursos/:id` para confirmar disponibilidad antes de crear.
2. **Solicitud → Notificar:** `requests-service` llama a `notifications-service POST /api/notificaciones` al cambiar estado.
3. **Reserva → Notificar:** `reservations-service` llama a `notifications-service` al confirmar/cancelar.
4. **Evento → Notificar:** `events-service` llama a `notifications-service` al crear evento.
5. **Dashboard:** Consulta endpoints de cada servicio o recibe datos ya agregados.

---

## Orden de implementación sugerido

1. `users-service` (auth + usuarios) — base para todo.
2. `resources-service` (sin dependencias).
3. `requests-service` (depende de users, notifica a notifications).
4. `reservations-service` (depende de users y resources).
5. `events-service` (depende de users, notifica a notifications).
6. `notifications-service` (depende de users).
7. Endpoints de `dashboard` distribuidos o agregados.

---

## Variables de entorno por servicio

Cada servicio necesita su propia conexión MySQL:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (nombre de la base de datos del servicio).
- `JWT_SECRET`, `JWT_EXPIRES_IN`.
- `PORT`.
- `SERVICE_URL` (URL base del servicio para comunicación inter-servicio).

---

## Docker

- `docker-compose.yml` debe levantar:
  - MySQL 8.0 (única instancia).
  - 6 servicios Node.js (build desde `backend/Dockerfile` o individuales).
  - Variables de entorno por servicio apuntando a la misma instancia MySQL pero con `DB_NAME` diferente.
- Script de inicialización SQL para crear las 6 bases de datos y tablas.
