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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

export default app;
