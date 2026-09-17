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
