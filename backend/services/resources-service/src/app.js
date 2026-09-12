import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import recursosRoutes from './routes/recursos.js';
import tiposRoutes from './routes/tipos.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/recursos', recursosRoutes);
app.use('/api/tipos', tiposRoutes);
//Nuevo
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'resources-service' });
});

app.use(errorHandler);

export default app;
