import Notificacion, { TIPOS_VALIDOS } from "../models/Notificacion.js";

function normalizarTipo(tipo) {
  if (!tipo) return null;
  const t = String(tipo).toLowerCase();
  return TIPOS_VALIDOS.includes(t) ? t : null;
}

export async function crearNotificacion(req, res, next) {
  try {
    const {
      usuario_id,
      titulo,
      mensaje,
      tipo,
      referencia_id = null,
      referencia_tipo = null
    } = req.body;

    if (usuario_id === undefined || usuario_id === null) {
      return res.status(400).json({ error: "El campo usuario_id es requerido" });
    }
    if (!titulo || !String(titulo).trim()) {
      return res.status(400).json({ error: "El campo titulo es requerido" });
    }
    if (!mensaje || !String(mensaje).trim()) {
      return res.status(400).json({ error: "El campo mensaje es requerido" });
    }

    const tipoNormalizado = normalizarTipo(tipo);
    if (!tipoNormalizado) {
      return res.status(400).json({
        error: `El campo tipo es inválido. Valores permitidos: ${TIPOS_VALIDOS.join(", ")}`
      });
    }

    const id = await Notificacion.crear({
      usuario_id: Number(usuario_id),
      titulo: String(titulo).trim(),
      mensaje: String(mensaje).trim(),
      tipo: tipoNormalizado,
      referencia_id: referencia_id !== undefined && referencia_id !== null ? Number(referencia_id) : null,
      referencia_tipo: referencia_tipo ? String(referencia_tipo).trim() : null
    });

    return res.status(201).json({
      message: "Notificación creada correctamente",
      id
    });
  } catch (err) {
    next(err);
  }
}

export async function listarNotificaciones(req, res, next) {
  try {
    const usuario_id = req.user.id;
    const notificaciones = await Notificacion.listarPorUsuario(usuario_id);
    return res.status(200).json({ notificaciones });
  } catch (err) {
    next(err);
  }
}

export async function contarNoLeidas(req, res, next) {
  try {
    const usuario_id = req.user.id;
    const total = await Notificacion.contarNoLeidas(usuario_id);
    return res.status(200).json({ no_leidas: total });
  } catch (err) {
    next(err);
  }
}

export async function marcarLeida(req, res, next) {
  try {
    const usuario_id = req.user.id;
    const id = Number(req.params.id);

    const existente = await Notificacion.obtenerPorId(id);
    if (!existente) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }
    if (existente.usuario_id !== usuario_id) {
      return res.status(403).json({ error: "No autorizado para modificar esta notificación" });
    }

    await Notificacion.marcarLeida(id, usuario_id);
    return res.status(200).json({ message: "Notificación marcada como leída" });
  } catch (err) {
    next(err);
  }
}

export async function marcarTodas(req, res, next) {
  try {
    const usuario_id = req.user.id;
    const afectadas = await Notificacion.marcarTodas(usuario_id);
    return res.status(200).json({
      message: "Todas las notificaciones marcadas como leídas",
      afectadas
    });
  } catch (err) {
    next(err);
  }
}

export async function eliminarNotificacion(req, res, next) {
  try {
    const usuario_id = req.user.id;
    const id = Number(req.params.id);

    const existente = await Notificacion.obtenerPorId(id);
    if (!existente) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }
    if (existente.usuario_id !== usuario_id) {
      return res.status(403).json({ error: "No autorizado para eliminar esta notificación" });
    }

    await Notificacion.eliminar(id, usuario_id);
    return res.status(200).json({ message: "Notificación eliminada correctamente" });
  } catch (err) {
    next(err);
  }
}

export async function countGlobalNoLeidas(req, res, next) {
  try {
    const total = await Notificacion.contarGlobalNoLeidas();
    return res.status(200).json({ no_leidas: total });
  } catch (err) {
    next(err);
  }
}
