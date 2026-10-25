# Pruebas de seguridad (B-001 a B-012)

Requieren Node.js >= 22.15 y las dependencias de desarrollo del backend:

```bash
pnpm --dir backend install --frozen-lockfile
pnpm --dir backend test
```

Se prueba el arranque del middleware real de los seis servicios en procesos
aislados y su autenticacion/autorizacion mediante un servidor HTTP de prueba.
El hook de resolucion solo proporciona la dependencia real `jsonwebtoken`;
no sustituye la firma ni la verificacion de JWT por mocks.

Los probes de autenticacion no ejecutan dotenv, no leen ningun `.env` y no
heredan secretos del entorno. No necesitan MySQL o Docker. `security.test.mjs`
añade pruebas del gateway, plazos HTTP, validacion y configuracion. La validacion
opcional de Compose se omite si la herramienta no está disponible.

`pnpm --dir backend run test:mysql` ejecuta aparte un MySQL 8 efimero en Docker:
prueba cuentas, migraciones reejecutables, controladores/modelos reales,
concurrencia, eventos privados y login/refresh con contraseñas sinteticas.
`roles-http.test.mjs` amplia la cobertura y levanta el gateway y los seis
servicios reales contra ese MySQL para recorrer los cuatro roles por HTTP:
propiedad de registros, transiciones, PQRS, reservas, recursos, catalogo y
configuracion. Nunca usa el volumen del proyecto ni su `.env`.

`frontend-session.test.mjs` prueba el modulo real de sesion del frontend con
`localStorage` simulado: claves de sesion, refresh compartido, cambio de rol,
logout durante un refresh pendiente, cambio de cuenta y almacenamiento
bloqueado. No necesita navegador.

## Aplicacion manual de la configuracion

1. Genera **una sola** clave con `openssl rand -hex 32` en tu terminal local.
2. Configura manualmente `JWT_SECRET` con esa clave en `backend/.env`, sin
   sobrescribir el archivo completo. Si ejecutas los servicios por separado,
   configura la misma clave en los seis entornos.
3. No compartas la clave ni la guardes en archivos versionados.
4. Sigue primero `backend/SECURITY-UPGRADE.md`: B-002 a B-012 añaden variables
   obligatorias y migraciones. B-003 ya impide copiar `.env` al gateway. Tras
   configurar cuentas y migrar, desde `backend/` puedes recrear los servicios:

   ```bash
   docker compose up -d --build users-service requests-service reservations-service resources-service events-service notifications-service
   ```

5. Inicia sesion de nuevo y verifica llamadas autenticadas a los seis servicios
   mediante el gateway. Los access previos a la rotacion dejaran de ser validos;
   tambien los refresh si estaban firmados con la misma clave anterior.

El minimo de 32 bytes y el rechazo de ejemplos no prueban la aleatoriedad de
una clave arbitraria; por eso debe generarse con el comando indicado. Se
conservan access de 15 minutos, refresh de 7 dias y RBAC por rol. Los middleware
tambien exigen finalidad access, emisor, audiencia, HS256 e identidad/rol válidos.
