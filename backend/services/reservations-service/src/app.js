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

app.use(errorHandler);

export default app;
