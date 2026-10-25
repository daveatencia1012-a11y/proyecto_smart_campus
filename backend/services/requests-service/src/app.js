import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import solicitudesRoutes from './routes/solicitudes.js';
import pqrsRoutes from './routes/pqrs.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/pqrs', pqrsRoutes);
//Nuevo
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'requests-service' });
});

app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(`[requests-service] ${err.code || err.name || 'ERROR'}`);
  res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor' : err.message
  });
});

export default app;
