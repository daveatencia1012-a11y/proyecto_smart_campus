# UAJS Smart Campus

Plataforma web académica orientada a centralizar y articular servicios universitarios mediante una arquitectura distribuida basada en **React, API Gateway y microservicios**.

Este repositorio corresponde al desarrollo del proyecto integrador **UAJS Smart Campus** para la asignatura **Sistemas Distribuidos**, dentro del alcance del **Entregable 1: Diseño funcional, Frontend, Backend base y estructura de Microservicios**.

---

## Descripción del proyecto

UAJS Smart Campus busca reunir en una sola plataforma diferentes servicios utilizados por la comunidad universitaria, permitiendo gestionar funcionalidades como solicitudes, reservas, recursos, eventos y notificaciones.

La solución está organizada siguiendo una arquitectura distribuida:

```text
Usuario
   │
   ▼
Frontend React
   │
   │ /api
   ▼
API Gateway
   │
   ├── Users Service
   ├── Requests Service
   ├── Reservations Service
   ├── Resources Service
   ├── Events Service
   └── Notifications Service
          │
          ▼
        MySQL
```

El frontend se comunica con un API Gateway encargado de enrutar las solicitudes hacia los microservicios correspondientes.

---

## Objetivo

Desarrollar una primera versión funcional y arquitectónica de UAJS Smart Campus que permita integrar servicios universitarios mediante un frontend en React, un API Gateway y microservicios independientes.

Dentro del alcance actual del proyecto se busca:

- Implementar una interfaz web funcional y navegable.
- Centralizar el acceso a los principales servicios universitarios.
- Separar las funcionalidades del backend en microservicios.
- Gestionar solicitudes y reservas desde el frontend.
- Exponer APIs REST mediante un API Gateway.
- Implementar mecanismos de autenticación y autorización.
- Disponer de health checks para verificar el estado de los servicios.
- Mantener una estructura preparada para continuar evolucionando la plataforma.

---

## Funcionalidades implementadas

A partir del código actualmente disponible en el repositorio se identifican las siguientes funcionalidades:

### Acceso y navegación

- Landing page.
- Inicio de sesión.
- Rutas protegidas.
- Control de acceso para módulos administrativos.
- Dashboard.
- Navegación mediante React Router.

### Servicios universitarios

- Visualización de servicios.
- Consulta del detalle de un servicio.
- Gestión de solicitudes.
- Consulta del detalle de solicitudes.
- Creación y eliminación de solicitudes desde el frontend.
- Seguimiento de estados de solicitudes.
- Gestión de reservas.
- Consulta del detalle de reservas.
- Creación, actualización y cancelación de reservas.
- Consulta de recursos.
- Gestión de eventos.
- Calendario.
- PQRS.
- Notificaciones.
- Perfil de usuario.
- Configuración.
- Módulo de ayuda.
- Módulos administrativos.

### Comportamiento del frontend

El frontend incluye:

- Manejo de estados con `useState`.
- Efectos mediante `useEffect`.
- Custom hooks, entre ellos `useTheme`.
- Estados de carga y error.
- Formularios con validaciones.
- Búsqueda y filtrado de información.
- Componentes reutilizables.
- Convenciones de nombres CSS compatibles con metodología BEM.

---
## Arquitectura

La arquitectura implementada se divide principalmente en tres niveles.

### 1. Frontend

Aplicación construida con React y Vite.

El archivo `vite.config.js` configura un proxy para enviar las peticiones que comienzan por `/api` hacia el API Gateway:

```text
Frontend
   │
   │ /api/*
   ▼
http://localhost:3200
```

### 2. API Gateway

El Gateway se encuentra implementado en:

```text
backend/src/app.js
```

Su responsabilidad principal es recibir las solicitudes del frontend y dirigirlas al microservicio correspondiente.

Puerto predeterminado:

```text
3200
```

### 3. Microservicios

El backend contiene seis microservicios principales:

| Microservicio | Responsabilidad principal | Puerto esperado |
| --- | --- | ---: |
| `users-service` | Usuarios, autenticación, roles y dashboard | 3201 |
| `requests-service` | Solicitudes y PQRS | 3202 |
| `reservations-service` | Reservas y disponibilidad | 3203 |
| `resources-service` | Recursos y tipos de recursos | 3204 |
| `events-service` | Eventos y tipos de eventos | 3205 |
| `notifications-service` | Notificaciones | 3206 |

Cada microservicio expone un endpoint:

```text
GET /health
```

para verificar si se encuentra activo.

---
## Tecnologías utilizadas

| Tecnología | Uso dentro del proyecto |
| --- | --- |
| JavaScript / JSX | Lenguaje principal del frontend y backend |
| React 19.2.8 | Desarrollo de la interfaz |
| React DOM 19.2.8 | Renderizado de la aplicación React |
| React Router DOM 7.18.2 | Navegación y rutas |
| Vite 8.2.0 | Entorno de desarrollo y compilación del frontend |
| Node.js | Ejecución del backend y los microservicios |
| Express | Creación del API Gateway y APIs REST |
| http-proxy-middleware | Enrutamiento del API Gateway hacia los microservicios |
| MySQL | Persistencia utilizada por los microservicios |
| mysql2 | Conexión entre Node.js y MySQL |
| JSON Web Token | Autenticación basada en tokens en los servicios que la utilizan |
| bcrypt | Manejo de contraseñas en servicios que requieren autenticación |
| Axios | Comunicación HTTP utilizada en algunos microservicios |
| CORS | Configuración de acceso entre aplicaciones |
| dotenv | Lectura de variables de entorno |
| ESLint | Verificación estática del código del frontend |
| Git / GitHub | Control de versiones y trabajo colaborativo |

> Las versiones de Express y de algunas dependencias no son idénticas en todos los microservicios. Debe consultarse el `package.json` de cada servicio antes de realizar una actualización global.

---

## Estructura del proyecto

Estructura simplificada basada en el repositorio actual:

```text
proyecto_smart_campus/
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   └── app.js
│   │
│   ├── services/
│   │   ├── users-service/
│   │   ├── requests-service/
│   │   ├── reservations-service/
│   │   ├── resources-service/
│   │   ├── events-service/
│   │   └── notifications-service/
│   │
│   └── package.json
│
├── .gitignore
└── README.md
```

### Directorios principales

#### `frontend/`

Contiene la interfaz de usuario desarrollada con React.

Entre sus elementos principales se encuentran:

- `components/`: componentes reutilizables.
- `pages/`: vistas principales.
- `hooks/`: custom hooks.
- `context/`: contextos utilizados por React.
- `layouts/`: estructuras compartidas entre páginas.
- `services/`: funciones encargadas de comunicarse con las APIs.
- `assets/`: recursos visuales.
- `App.jsx`: configuración principal de rutas.
- `vite.config.js`: configuración de Vite y del proxy hacia el API Gateway.

#### `backend/`

Contiene el API Gateway principal.

El archivo:

```text
backend/src/app.js
```

define el enrutamiento de las solicitudes hacia cada microservicio y proporciona un health check global.

#### `backend/services/`

Contiene los seis microservicios del sistema:

```text
users-service
requests-service
reservations-service
resources-service
events-service
notifications-service
```

Cada servicio posee su propia configuración, dependencias y punto de ejecución.

---

## Requisitos previos

Antes de ejecutar el proyecto se necesita:

- Git.
- Node.js.
- npm.
- Un servidor MySQL accesible.
- Un navegador web moderno.
- Disponibilidad de los puertos `3200` a `3206`, salvo que se configuren otros mediante variables de entorno.

### Versión de Node.js

El repositorio actualmente **no declara una versión exacta de Node.js mediante la propiedad `engines` de `package.json`**.

Por esta razón, no se establece una versión específica en este README. El equipo debería definir y documentar la versión utilizada durante el desarrollo para facilitar una instalación reproducible.

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/daveatencia1012-a11y/proyecto_smart_campus.git
cd proyecto_smart_campus
```

### 2. Instalar dependencias del frontend

```bash
cd frontend
npm install
```

### 3. Instalar dependencias del API Gateway

Desde la raíz del repositorio:

```bash
cd backend
npm install
```

### 4. Instalar dependencias de los microservicios

#### Users Service

```bash
cd backend/services/users-service
npm install
```

#### Requests Service

```bash
cd backend/services/requests-service
npm install
```

#### Reservations Service

```bash
cd backend/services/reservations-service
npm install
```

#### Resources Service

```bash
cd backend/services/resources-service
npm install
```

#### Events Service

```bash
cd backend/services/events-service
npm install
```

#### Notifications Service

```bash
cd backend/services/notifications-service
npm install
```

---

## Configuración

El proyecto utiliza variables de entorno para configurar conexiones, puertos, URLs entre servicios y autenticación.

Los archivos `.env` **no deben subirse al repositorio**.

El `.gitignore` del proyecto ya incluye reglas para evitar el seguimiento de:

```text
.env
.env.local
.env.*.local
node_modules/
dist/
build/
```

### API Gateway

El Gateway admite las siguientes variables:

```dotenv
PORT=3200

USERS_SERVICE_URL=http://localhost:3201
REQUESTS_SERVICE_URL=http://localhost:3202
RESERVATIONS_SERVICE_URL=http://localhost:3203
RESOURCES_SERVICE_URL=http://localhost:3204
EVENTS_SERVICE_URL=http://localhost:3205
NOTIFICATIONS_SERVICE_URL=http://localhost:3206
```

Si estas variables no se definen, el código utiliza esas URLs locales como valores predeterminados.

### Users Service

El repositorio contiene un archivo `.env.example`.

Debe crearse un archivo `.env` local utilizando ese archivo como referencia y reemplazando cualquier contraseña o secreto de demostración por valores propios y seguros.

Variables identificadas:

```text
PORT
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
JWT_SECRET
JWT_EXPIRES_IN
JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRES_IN
```

### Reservations Service

También contiene un `.env.example`.

Variables identificadas:

```text
PORT
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
JWT_SECRET
RESOURCES_SERVICE_URL
NOTIFICATIONS_SERVICE_URL
BUSINESS_HOURS_START
BUSINESS_HOURS_END
```

Si todos los servicios se ejecutan directamente en el equipo local, las URLs entre servicios deben apuntar al host y puerto correspondientes del entorno local.

### Notifications Service

Variables identificadas:

```text
PORT
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
JWT_SECRET
```

### Requests, Resources y Events

Los archivos de configuración de base de datos de estos servicios utilizan las variables:

```text
DB_HOST
DB_USER
DB_PASSWORD
DB_NAME
```

Debe verificarse la configuración específica de cada servicio antes de ejecutarlo.

> No publique contraseñas, tokens, claves JWT, API keys ni información sensible en GitHub.

---

## Base de datos

Los microservicios utilizan **MySQL** mediante la librería `mysql2`.

Se identificaron las siguientes bases de datos predeterminadas:

| Microservicio | Base de datos |
| --- | --- |
| Users | `users_db` |
| Requests | `requests_db` |
| Reservations | `reservations_db` |
| Resources | `resources_db` |
| Events | `events_db` |
| Notifications | `notifications_db` |

Si todavía no existen, pueden crearse las bases vacías en MySQL:

```sql
CREATE DATABASE IF NOT EXISTS users_db;
CREATE DATABASE IF NOT EXISTS requests_db;
CREATE DATABASE IF NOT EXISTS reservations_db;
CREATE DATABASE IF NOT EXISTS resources_db;
CREATE DATABASE IF NOT EXISTS events_db;
CREATE DATABASE IF NOT EXISTS notifications_db;
```

### Importante

La revisión actual del repositorio permite confirmar las conexiones a MySQL, pero **no permite documentar de forma confiable un procedimiento completo de migraciones, creación de tablas o seeders**.

Por esta razón, este README no inventa estructuras SQL ni datos iniciales.

Para que la instalación pueda reproducirse desde cero, el equipo debe documentar o incorporar los scripts utilizados para crear:

- Tablas.
- Relaciones.
- Datos iniciales o de prueba.
- Usuarios de demostración, si aplican.

---

## Ejecución del proyecto

El orden recomendado para una ejecución local es:

```text
MySQL
  ↓
Microservicios
  ↓
API Gateway
  ↓
Frontend
```

Cada servicio debe ejecutarse en una terminal independiente.

### Terminal 1 - Users Service

```bash
cd backend/services/users-service
npm start
```

### Terminal 2 - Requests Service

```bash
cd backend/services/requests-service
npm start
```

### Terminal 3 - Reservations Service

```bash
cd backend/services/reservations-service
npm start
```

### Terminal 4 - Resources Service

```bash
cd backend/services/resources-service
npm start
```

### Terminal 5 - Events Service

```bash
cd backend/services/events-service
npm start
```

### Terminal 6 - Notifications Service

```bash
cd backend/services/notifications-service
npm start
```

### Terminal 7 - API Gateway

```bash
cd backend
npm start
```

El Gateway utiliza por defecto:

```text
http://localhost:3200
```

### Terminal 8 - Frontend

```bash
cd frontend
npm run dev
```

Vite mostrará en la terminal la dirección local donde quedó disponible el frontend.

El repositorio no fija explícitamente un puerto personalizado para la interfaz mediante `vite.config.js`; por ello debe utilizarse la dirección que Vite muestre al iniciar.

---


