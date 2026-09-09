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
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Error interno del servidor"
  });
});

export default app;
