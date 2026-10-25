import express from 'express';
import cors from 'cors';
import eventosRoutes from './routes/eventos.js';
import tiposEventoRoutes from './routes/tipos-evento.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/eventos', eventosRoutes);
app.use('/api/tipos-evento', tiposEventoRoutes);
//Nuevo
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'events-service' });
});

// Rutas inexistentes: respuesta JSON consistente en lugar del HTML por defecto de Express.
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use(errorHandler);

export default app;
