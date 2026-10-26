import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";
import { rateLimit } from "express-rate-limit";
import { pathToFileURL } from "node:url";

const DEFAULT_CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

// Orígenes permitidos (DEF-04): lista separada por comas en CORS_ORIGINS.
export function parseCorsOrigins(value) {
  const origins = String(value || "").split(",").map(origin => origin.trim().replace(/\/$/, "")).filter(Boolean);
  return origins.length ? origins : DEFAULT_CORS_ORIGINS;
}

export function createApp(options = {}) {
  const app = express();
  app.disable("x-powered-by");
  const allowedOrigins = options.corsOrigins || parseCorsOrigins(process.env.CORS_ORIGINS);
  // Sin cabecera Origin (curl, Postman, llamadas entre servicios) no aplica CORS y se permite.
  // Un origen fuera de la lista no recibe Access-Control-Allow-Origin y el navegador bloquea la respuesta.
  app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)) }));
  const services = options.services || {
    users: process.env.USERS_SERVICE_URL || "http://localhost:3201",
    requests: process.env.REQUESTS_SERVICE_URL || "http://localhost:3202",
    reservations: process.env.RESERVATIONS_SERVICE_URL || "http://localhost:3203",
    resources: process.env.RESOURCES_SERVICE_URL || "http://localhost:3204",
    events: process.env.EVENTS_SERVICE_URL || "http://localhost:3205",
    notifications: process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:3206",
  };

  // Si se añade un reverse proxy, confiar solo en sus direcciones conocidas.
  // No activar trust proxy indiscriminado: permitiría falsificar la IP.
  app.use("/api/auth/login", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: options.loginLimit ?? 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Demasiados intentos; inténtalo más tarde" },
  }));
  app.use("/api/auth/refresh", rateLimit({
    windowMs: 60 * 1000,
    limit: options.refreshLimit ?? 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Demasiadas renovaciones" },
  }));

  // Los productores internos llaman directamente a notifications-service.
  app.use((req, res, next) => {
    delete req.headers["x-internal-token"];
    // Sin callback por petición: httpxy acumula esos listeners en sockets keep-alive.
    req.socket.setTimeout(20000);
    next();
  });

  const proxyRoutes = {
    "/api/auth": services.users,
    "/api/usuarios": services.users,
    "/api/dashboard": services.users,
    "/api/roles": services.users,
    "/api/permisos": services.users,
    "/api/configuracion": services.users,
    "/api/servicios": services.resources,
    "/api/solicitudes": services.requests,
    "/api/pqrs": services.requests,
    "/api/reservas": services.reservations,
    "/api/disponibilidad": services.reservations,
    "/api/recursos": services.resources,
    "/api/tipos": services.resources,
    "/api/eventos": services.events,
    "/api/tipos-evento": services.events,
    "/api/notificaciones": services.notifications,
  };

  const proxies = new Map();
  for (const [route, target] of Object.entries(proxyRoutes)) {
    if (!proxies.has(target)) proxies.set(target, createProxyMiddleware({
      target,
      changeOrigin: true,
      proxyTimeout: options.proxyTimeout ?? 15000,
      pathRewrite: (path, req) => req.originalUrl || req.baseUrl + path,
      on: {
        error: (err, req, res) => {
          const service = req.originalUrl.split('?')[0].split('/').slice(0,3).join('/');
          console.error(`Error en proxy ${service}: ${err.code || "UPSTREAM_ERROR"}`);
          if (res.headersSent) return res.destroy();
          const timeout = ["ETIMEDOUT", "ESOCKETTIMEDOUT", "ECONNRESET"].includes(err.code);
          res.status(timeout ? 504 : 502).json({ error: "Servicio no disponible", service });
        },
      },
    }));
    app.use(route, proxies.get(target));
  }

  app.get("/health", async (req, res) => {
    const checks = await Promise.all(Object.entries(services).map(async ([name, url]) => {
      try {
        const response = await fetch(`${url}/health`, {
          signal: AbortSignal.timeout(options.healthTimeout ?? 2000),
        });
        await response.body?.cancel();
        return [name, response.ok ? "ok" : "error"];
      } catch {
        return [name, "offline"];
      }
    }));
    const results = Object.fromEntries(checks);
    const allOk = Object.values(results).every(status => status === "ok");
    res.status(allOk ? 200 : 503).json({ gateway: "ok", services: results });
  });

  app.get("/", (req, res) => {
    res.json({
      name: "Smart Campus API Gateway",
      version: "1.0.0",
      endpoints: Object.keys(proxyRoutes),
    });
  });

  // Rutas que no pertenecen a ningún servicio: 404 en JSON, igual que los microservicios.
  app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });

  return app;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  dotenv.config();
  const PORT = process.env.PORT || 3200;
  createApp().listen(PORT, () => {
    console.log(`API Gateway ejecutándose en http://localhost:${PORT}`);
  });
}
