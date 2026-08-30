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

app.use(errorHandler);

export default app;
