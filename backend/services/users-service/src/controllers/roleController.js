import { ROLES } from '../models/User.js';
import Permiso from '../models/Permiso.js';

export async function listRoles(req, res, next) {
  try {
    return res.json({ roles: ROLES });
  } catch (error) {
    next(error);
  }
}

export async function listPermisos(req, res, next) {
  try {
    const { rol } = req.query;

    if (rol) {
      const permisos = await Permiso.findByRole(rol);
      return res.json({ rol, permisos });
    }

    const permisos = await Permiso.listAll();
    return res.json({ permisos });
  } catch (error) {
    next(error);
  }
}
