import express from 'express';
import cors from 'cors';
import reservasRoutes from './routes/reservas.js';
import disponibilidadRoutes from './routes/disponibilidad.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/reservas', reservasRoutes);
app.use('/api/disponibilidad', disponibilidadRoutes);
//Nuevo
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'reservations-service' });
});

// Rutas inexistentes: respuesta JSON consistente en lugar del HTML por defecto de Express.
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use(errorHandler);

export default app;
