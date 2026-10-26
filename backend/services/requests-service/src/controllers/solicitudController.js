import SolicitudModel from '../models/Solicitud.js';
import axios from '../config/http.js';
import dotenv from 'dotenv';
import { solicitudInput, filters as parseFilters, id, text } from '../validation.js';

dotenv.config();

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3206';

async function notifyStatusChange(solicitud) {
  try {
    await axios.post(`${NOTIFICATIONS_SERVICE_URL}/api/notificaciones`, {
      usuario_id: solicitud.usuario_id,
      tipo: 'SOLICITUD',
      titulo: 'Actualización de solicitud',
      mensaje: `Tu solicitud ${solicitud.codigo} cambió de estado a ${solicitud.estado}`,
      referencia_id: solicitud.id,
      referencia_tipo: 'solicitud'
    }, { headers: { 'x-internal-token': process.env.INTERNAL_API_TOKEN } });
  } catch (error) {
    console.error('Error al enviar notificación:', error.message);
  }
}

export const createSolicitud = async (req, res, next) => {
  try {
    const usuario_id = req.user.id;
    const data = { ...solicitudInput(req.body), usuario_id };
    const solicitud = await SolicitudModel.create(data);
    res.status(201).json(solicitud);
  } catch (error) {
    next(error);
  }
};

export const getSolicitudes = async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const solicitudes = await SolicitudModel.findAll(filters);
    res.json(solicitudes);
  } catch (error) {
    next(error);
  }
};

export const getSolicitudById = async (req, res, next) => {
  try {
    const solicitud = await SolicitudModel.findById(id(req.params.id));
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const isOwner = solicitud.usuario_id === req.user.id;
    const isStaff = req.user.rol === 'administrador' || req.user.rol === 'administrativo';
    if (!isOwner && !isStaff) return res.status(403).json({ error: 'No autorizado' });
    res.json(solicitud);
  } catch (error) {
    next(error);
  }
};

export const getMisSolicitudes = async (req, res, next) => {
  try {
    const solicitudes = await SolicitudModel.findAll({ ...parseFilters(req.query), usuario_id: req.user.id });
    res.json(solicitudes);
  } catch (error) {
    next(error);
  }
};

export const countSolicitudes = async (req, res, next) => {
  try {
    const filters = parseFilters(req.query);
    const [count, por_estado] = await Promise.all([SolicitudModel.count(filters.estado, filters), SolicitudModel.count(filters.estado, filters, true)]);
    res.json({ count, por_estado });
  } catch (error) {
    next(error);
  }
};

export const updateSolicitud = async (req, res, next) => {
  try {
    const fields = solicitudInput(req.body, true);
    if (fields.responsable_id) {
      try {
        await axios.get(`${process.env.USERS_SERVICE_URL || 'http://users-service:3201'}/api/usuarios/responsables/${fields.responsable_id}`, { headers: { Authorization: req.headers.authorization } });
      } catch (error) {
        if (error.status === 404) return res.status(400).json({ error: 'Responsable no válido o inactivo' });
        throw error;
      }
    }
    const updated = await SolicitudModel.update(id(req.params.id), fields);
    if (!updated) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const solicitud = await SolicitudModel.findById(req.params.id);
    res.json(solicitud);
  } catch (error) {
    next(error);
  }
};

export const updateSolicitudEstado = async (req, res, next) => {
  try {
    const estado = text(req.body?.estado, 'estado', 30);
    const updated = await SolicitudModel.updateEstado(id(req.params.id), estado, req.user.id);
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
    const deleted = await SolicitudModel.delete(id(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Solicitud no encontrada' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const countMisSolicitudes = async (req, res, next) => {
  try {
    const filters = { ...parseFilters(req.query), usuario_id: req.user.id };
    res.json({ count: await SolicitudModel.count(filters.estado, filters) });
  } catch (error) { next(error); }
};
