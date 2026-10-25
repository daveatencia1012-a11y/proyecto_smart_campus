import PqrsModel from '../models/Pqrs.js';
import axios from '../config/http.js';
import dotenv from 'dotenv';
import { filters, object, id, text, fail } from '../validation.js';

dotenv.config();

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:3206';

async function notifyPqrsUpdate(pqrs) {
  try {
    await axios.post(`${NOTIFICATIONS_SERVICE_URL}/api/notificaciones`, {
      usuario_id: pqrs.usuario_id,
      tipo: 'PQRS',
      titulo: 'Actualización de PQRS',
      mensaje: `Tu PQRS #${pqrs.id} cambió de estado a ${pqrs.estado}`,
      referencia_id: pqrs.id,
      referencia_tipo: 'pqrs'
    }, { headers: { 'x-internal-token': process.env.INTERNAL_API_TOKEN } });
  } catch (error) {
    console.error('Error al enviar notificación:', error.message);
  }
}

export const createPqrs = async (req, res, next) => {
  try {
    const usuario_id = req.user.id;
    object(req.body);
    if (!['peticion','queja','reclamo','sugerencia'].includes(req.body.tipo)) fail('Tipo de PQRS inválido');
    if (Object.keys(req.body).some(key => !['tipo','asunto','descripcion'].includes(key))) fail('Campos no permitidos');
    const data = { usuario_id, tipo: req.body.tipo, asunto: text(req.body.asunto, 'asunto', 150), descripcion: text(req.body.descripcion, 'descripcion', 10000) };
    const pqrs = await PqrsModel.create(data);
    res.status(201).json(pqrs);
  } catch (error) {
    next(error);
  }
};

export const getPqrsList = async (req, res, next) => {
  try {
    const pqrsList = await PqrsModel.findAll(filters(req.query));
    res.json(pqrsList);
  } catch (error) {
    next(error);
  }
};

export const getMisPqrs = async (req, res, next) => {
  try {
    const pqrsList = await PqrsModel.findAll({ ...filters(req.query), usuario_id: req.user.id });
    res.json(pqrsList);
  } catch (error) {
    next(error);
  }
};

export const getPqrsById = async (req, res, next) => {
  try {
    const pqrs = await PqrsModel.findById(id(req.params.id));
    if (!pqrs) return res.status(404).json({ error: 'PQRS no encontrada' });
    const isOwner = pqrs.usuario_id === req.user.id;
    const isStaff = req.user.rol === 'administrador' || req.user.rol === 'administrativo';
    if (!isOwner && !isStaff) return res.status(403).json({ error: 'No autorizado' });
    res.json(pqrs);
  } catch (error) {
    next(error);
  }
};

export const updatePqrs = async (req, res, next) => {
  try {
    object(req.body);
    if (Object.keys(req.body).some(key => !['estado','respuesta'].includes(key)) || !Object.keys(req.body).length) fail('Campos no permitidos');
    const fields = {};
    if (req.body.estado !== undefined) {
      if (!['registrada','en_revision','respondida','cerrada'].includes(req.body.estado)) fail('Estado de PQRS inválido');
      fields.estado = req.body.estado;
    }
    if (req.body.respuesta !== undefined) fields.respuesta = text(req.body.respuesta, 'respuesta', 10000);
    const updated = await PqrsModel.update(id(req.params.id), fields);
    if (!updated) return res.status(404).json({ error: 'PQRS no encontrada' });
    const pqrs = await PqrsModel.findById(req.params.id);
    await notifyPqrsUpdate(pqrs);
    res.json(pqrs);
  } catch (error) {
    next(error);
  }
};

export const deletePqrs = async (req, res, next) => {
  try {
    const deleted = await PqrsModel.delete(id(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'PQRS no encontrada' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const countPqrs = async (req, res, next) => {
  try {
    const scope = filters(req.query);
    const [count, por_estado] = await Promise.all([PqrsModel.count(scope), PqrsModel.count(scope, true)]);
    res.json({ count, por_estado });
  } catch (error) { next(error); }
};
