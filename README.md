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
