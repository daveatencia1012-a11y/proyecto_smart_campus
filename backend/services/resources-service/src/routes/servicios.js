import { Router } from 'express';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { fields, id, paging, fail } from '../validation.js';

const router = Router();
const read = async serviceId => {
  const [[row]] = await pool.execute('SELECT * FROM servicios WHERE id = ?', [serviceId]);
  return row;
};
function input(body, partial = false) {
  const { activo, ...rest } = body || {};
  const data = partial && activo !== undefined && !Object.keys(rest).length ? {} : fields(rest, { codigo:50, nombre:100, descripcion:10000, icono:30 }, partial);
  if (data.codigo && !/^[a-z][a-z0-9-]{1,49}$/.test(data.codigo)) fail('Código de servicio inválido');
  if (activo !== undefined) {
    if (![true,false,0,1].includes(activo)) fail('activo debe ser booleano');
    data.activo = Number(activo);
  }
  return data;
}
router.get('/', authenticate, async (req, res, next) => {
  try {
    const all = req.query.incluir_inactivos === 'true';
    if (all && req.user.rol !== 'administrador') return res.status(403).json({ error: 'No autorizado' });
    const { limit, offset } = paging(req.query);
    const [rows] = await pool.execute(`SELECT * FROM servicios ${all ? '' : 'WHERE activo = 1'} ORDER BY id LIMIT ? OFFSET ?`, [limit, offset]);
    res.json(rows);
  } catch (error) { next(error); }
});
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const row = await read(id(req.params.id));
    if (!row || !row.activo && req.user.rol !== 'administrador') return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(row);
  } catch (error) { next(error); }
});
router.post('/', authenticate, authorize('administrador'), async (req, res, next) => {
  try {
    const data = input(req.body);
    const [result] = await pool.execute('INSERT INTO servicios (codigo, nombre, descripcion, icono, activo) VALUES (?, ?, ?, ?, ?)', [data.codigo, data.nombre, data.descripcion ?? '', data.icono, data.activo ?? 1]);
    res.status(201).json(await read(result.insertId));
  } catch (error) { next(error); }
});
router.put('/:id', authenticate, authorize('administrador'), async (req, res, next) => {
  try {
    const serviceId = id(req.params.id);
    if (!await read(serviceId)) return res.status(404).json({ error: 'Servicio no encontrado' });
    const data = input(req.body, true);
    if (data.codigo !== undefined) fail('El código de un servicio es inmutable');
    const keys = Object.keys(data);
    await pool.execute(`UPDATE servicios SET ${keys.map(key => `${key} = ?`).join(', ')} WHERE id = ?`, [...keys.map(key => data[key]), serviceId]);
    res.json(await read(serviceId));
  } catch (error) { next(error); }
});
router.delete('/:id', authenticate, authorize('administrador'), async (req, res, next) => {
  try {
    const [result] = await pool.execute('UPDATE servicios SET activo = 0 WHERE id = ?', [id(req.params.id)]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.status(204).send();
  } catch (error) { next(error); }
});
export default router;
