import SolicitudModel from '../models/Solicitud.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3206';

async function notifyStatusChange(solicitud) {
  try {
    await axios.post(`${NOTIFICATIONS_SERVICE_URL}/api/notificaciones`, {
      usuario_id: solicitud.usuario_id,
      tipo: 'SOLICITUD',
      titulo: 'Actualización de solicitud',
      mensaje: `Tu solicitud #${solicitud.id} cambió de estado a ${solicitud.estado}`,
      referencia_id: solicitud.id,
      referencia_tipo: 'solicitud'
    });
  } catch (error) {
    console.error('Error al enviar notificación:', error.message);
  }
}

export const createSolicitud = async (req, res, next) => {
  try {
    const usuario_id = req.user.id;
    const data = { ...req.body, usuario_id };
    const solicitud = await SolicitudModel.create(data);
    res.status(201).json(solicitud);
  } catch (error) {
    next(error);
  }
};

export const getSolicitudes = async (req, res, next) => {
  try {
    const filters = {};
    const { estado, usuario_id, fecha_desde, fecha_hasta } = req.query;
    if (estado) filters.estado = estado;
    if (usuario_id) filters.usuario_id = usuario_id;
    if (fecha_desde) filters.fecha_desde = fecha_desde;
    if (fecha_hasta) filters.fecha_hasta = fecha_hasta;
    const solicitudes = await SolicitudModel.findAll(filters);
    res.json(solicitudes);
  } catch (error) {
    next(error);
  }
};

export const getSolicitudById = async (req, res, next) => {
  try {
    const solicitud = await SolicitudModel.findById(req.params.id);
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const isOwner = solicitud.usuario_id === req.user.id;
    const isAdmin = req.user.rol === 'administrador';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'No autorizado' });
    res.json(solicitud);
  } catch (error) {
    next(error);
  }
};

export const countSolicitudes = async (req, res, next) => {
  try {
    const { estado } = req.query;
    const count = await SolicitudModel.count(estado);
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

export const updateSolicitud = async (req, res, next) => {
  try {
    const { tipo_servicio, dependencia, descripcion, prioridad, responsable_id } = req.body;
    const updated = await SolicitudModel.update(req.params.id, { tipo_servicio, dependencia, descripcion, prioridad, responsable_id });
    if (!updated) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const solicitud = await SolicitudModel.findById(req.params.id);
    res.json(solicitud);
  } catch (error) {
    next(error);
  }
};

export const updateSolicitudEstado = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const updated = await SolicitudModel.updateEstado(req.params.id, estado);
    if (!updated) return res.status(404).json({ error: 'Solicitud no encontrada o transición no válida' });
    const solicitud = await SolicitudModel.findById(req.params.id);
    await notifyStatusChange(solicitud);
    res.json(solicitud);
  } catch (error) {
    next(error);
  }
};

export const deleteSolicitud = async (req, res, next) => {
  try {
    const deleted = await SolicitudModel.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Solicitud no encontrada' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
