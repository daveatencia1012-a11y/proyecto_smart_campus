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
