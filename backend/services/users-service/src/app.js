import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import roleRoutes from './routes/roles.js';
import dashboardRoutes from './routes/dashboard.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ servicio: 'users-service', estado: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api', roleRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
