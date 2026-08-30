# Plan: .gitignore/.dockerignore consistency

## Problema
Los archivos `.gitignore` no son consistentes en el monorepo:
- Falta `.gitignore` en raíz, `backend/` y `backend/services/`
- `frontend/.gitignore` existe pero está vacío
- Solo `notifications-service` tiene `.dockerignore`; los demás servicios no

## Objetivo
Garantizar que cada nivel del proyecto tenga un `.gitignore` apropiado y que todos los servicios tengan `.dockerignore` coherente.

## Tareas

1. **Crear `.gitignore` en raíz** (`/.gitignore`)
   - Ignorar: `node_modules/`, `.env`, `.env.*`, `dist/`, `build/`, `*.log`, `coverage/`, `.DS_Store`, `Thumbs.db`, `*.local`, `.vscode/`, `.idea/`, `pnpm-lock.yaml` (en raíz), `docker-compose.override.yml`

2. **Crear `.gitignore` en `backend/`** (`backend/.gitignore`)
   - Ignorar: `node_modules/`, `.env`, `dist/`, `build/`, `*.log`, `coverage/`, `docker-compose.override.yml`, `.env.local`

3. **Crear `.gitignore` en `backend/services/`** (`backend/services/.gitignore`)
   - Ignorar: `node_modules/`, `.env`, `.env.local`, `dist/`, `*.log`

4. **Actualizar `frontend/.gitignore`** (`frontend/.gitignore`)
   - Reemplazar contenido vacío por ignores estándar de Node/frontend: `node_modules/`, `.env`, `.env.local`, `dist/`, `build/`, `*.log`, `.vscode/`, `.idea/`

5. **Crear `.dockerignore` en cada servicio faltante**
   - Copiar el contenido existente de `notifications-service/.dockerignore` a:
     - `users-service/.dockerignore`
     - `requests-service/.dockerignore`
     - `reservations-service/.dockerignore`
     - `resources-service/.dockerignore`
     - `events-service/.dockerignore`
   - Contenido: `node_modules`, `.env`, `*.log`, `.dockerignore` (opcional), `docker-compose*.yml`

## Validación
- Verificar que cada nivel raíz, backend, services, frontend y cada servicio tenga su respectivo `.gitignore` con contenido no vacío.
- Verificar que cada uno de los 6 servicios tenga `.dockerignore`.
