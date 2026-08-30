import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { EventoModel } from '../models/Evento.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const tipos = ['academico', 'institucional', 'cultural', 'deportivo', 'otro'];
    res.json(tipos);
  } catch (error) {
    next(error);
  }
});

export default router;
