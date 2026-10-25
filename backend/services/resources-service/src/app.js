import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import recursosRoutes from './routes/recursos.js';
import tiposRoutes from './routes/tipos.js';
import serviciosRoutes from './routes/servicios.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/recursos', recursosRoutes);
app.use('/api/tipos', tiposRoutes);
app.use('/api/servicios', serviciosRoutes);
//Nuevo
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'resources-service' });
});

// Rutas inexistentes: respuesta JSON consistente en lugar del HTML por defecto de Express.
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use(errorHandler);

export default app;
