import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const services = {
  users:          process.env.USERS_SERVICE_URL          || "http://localhost:3201",
  requests:       process.env.REQUESTS_SERVICE_URL       || "http://localhost:3202",
  reservations:   process.env.RESERVATIONS_SERVICE_URL   || "http://localhost:3203",
  resources:      process.env.RESOURCES_SERVICE_URL      || "http://localhost:3204",
  events:         process.env.EVENTS_SERVICE_URL         || "http://localhost:3205",
  notifications:  process.env.NOTIFICATIONS_SERVICE_URL  || "http://localhost:3206",
};

const proxyRoutes = {
  "/api/auth":           services.users,
  "/api/usuarios":       services.users,
  "/api/dashboard":      services.users,
  "/api/roles":          services.users,
  "/api/solicitudes":    services.requests,
  "/api/pqrs":           services.requests,
  "/api/reservas":       services.reservations,
  "/api/disponibilidad": services.reservations,
  "/api/recursos":       services.resources,
  "/api/tipos":          services.resources,
  "/api/eventos":        services.events,
  "/api/tipos-evento":   services.events,
  "/api/notificaciones": services.notifications,
};

for (const [route, target] of Object.entries(proxyRoutes)) {
  app.use(route, createProxyMiddleware({
    target,
    changeOrigin: true,
    onError: (err, req, res) => {
      console.error(`Error en proxy ${route}: ${err.message}`);
      res.status(502).json({ error: "Servicio no disponible", service: route });
    },
  }));
}

app.get("/health", async (req, res) => {
  const results = {};
  for (const [name, url] of Object.entries(services)) {
    try {
      const response = await fetch(`${url}/health`);
      results[name] = response.ok ? "ok" : "error";
    } catch {
      results[name] = "offline";
    }
  }
  const allOk = Object.values(results).every((s) => s === "ok");
  res.status(allOk ? 200 : 503).json({ gateway: "ok", services: results });
});

app.get("/", (req, res) => {
  res.json({
    name: "Smart Campus API Gateway",
    version: "1.0.0",
    endpoints: Object.keys(proxyRoutes),
  });
});

const PORT = process.env.PORT || 3200;

app.listen(PORT, () => {
  console.log(`API Gateway ejecutándose en http://localhost:${PORT}`);
});