import PqrsModel from '../models/Pqrs.js';
import axios from 'axios';
import dotenv from 'dotenv';

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
    });
  } catch (error) {
    console.error('Error al enviar notificación:', error.message);
  }
}

export const createPqrs = async (req, res, next) => {
  try {
    const usuario_id = req.user.id;
    const data = { ...req.body, usuario_id };
    const pqrs = await PqrsModel.create(data);
    res.status(201).json(pqrs);
  } catch (error) {
    next(error);
  }
};

export const getPqrsList = async (req, res, next) => {
  try {
    const filters = {};
    const { tipo, estado } = req.query;
    if (tipo) filters.tipo = tipo;
    if (estado) filters.estado = estado;
    const pqrsList = await PqrsModel.findAll(filters);
    res.json(pqrsList);
  } catch (error) {
    next(error);
  }
};

export const getPqrsById = async (req, res, next) => {
  try {
    const pqrs = await PqrsModel.findById(req.params.id);
    if (!pqrs) return res.status(404).json({ error: 'PQRS no encontrada' });
    const isOwner = pqrs.usuario_id === req.user.id;
    const isAdmin = req.user.rol === 'administrador';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'No autorizado' });
    res.json(pqrs);
  } catch (error) {
    next(error);
  }
};

export const updatePqrs = async (req, res, next) => {
  try {
    const { estado, respuesta } = req.body;
    const updated = await PqrsModel.update(req.params.id, { estado, respuesta });
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
    const deleted = await PqrsModel.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'PQRS no encontrada' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
