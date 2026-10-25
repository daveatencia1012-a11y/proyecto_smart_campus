import express from "express";
import cors from "cors";
import notificacionesRouter from "./routes/notificaciones.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "notifications-service" });
});

app.use("/api/notificaciones", notificacionesRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(`[notifications-service] ${err.code || err.name || 'ERROR'}`);
  res.status(status).json({
    error: status >= 500 ? "Error interno del servidor" : err.message
  });
});

export default app;
