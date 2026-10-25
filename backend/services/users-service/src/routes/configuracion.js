import { Router } from 'express';
import db from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const read = async () => {
  const [[row]] = await db.execute('SELECT nombre_campus, correo_contacto, mensaje_institucional FROM configuracion WHERE id = 1');
  if (!row) throw Object.assign(new Error('Configuración no inicializada; aplica la migración 002'), { status: 503 });
  return row;
};
router.get('/', authenticate, async (req, res, next) => {
  try { res.json({ configuracion: await read() }); } catch (error) { next(error); }
});
router.put('/', authenticate, authorize('administrador'), async (req, res, next) => {
  try {
    const allowed = ['nombre_campus', 'correo_contacto', 'mensaje_institucional'];
    const body = req.body;
    if (!body || Array.isArray(body) || Object.keys(body).some(key => !allowed.includes(key)) || !Object.keys(body).length) {
      return res.status(400).json({ error: 'Campos de configuración no permitidos' });
    }
    const current = await read();
    const fields = { ...current, ...body };
    if (typeof fields.nombre_campus !== 'string' || !fields.nombre_campus.trim() || fields.nombre_campus.length > 120 ||
        typeof fields.correo_contacto !== 'string' || fields.correo_contacto.length > 254 || (fields.correo_contacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.correo_contacto)) ||
        typeof fields.mensaje_institucional !== 'string' || fields.mensaje_institucional.length > 1000) {
      return res.status(400).json({ error: 'Configuración institucional inválida' });
    }
    // Solo escribir los campos enviados: no sobrescribir cambios concurrentes.
    const keys = Object.keys(body);
    await db.execute(`UPDATE configuracion SET ${keys.map(key => `${key} = ?`).join(', ')} WHERE id = 1`, keys.map(key => body[key].trim()));
    res.json({ configuracion: await read() });
  } catch (error) { next(error); }
});
export default router;
