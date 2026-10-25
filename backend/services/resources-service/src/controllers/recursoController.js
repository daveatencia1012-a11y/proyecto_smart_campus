import Recurso from '../models/Recurso.js';
import { recurso as validateRecurso, id, paging, fail } from '../validation.js';

export const createRecurso = async (req, res, next) => {
  try {
    const recurso = await Recurso.create(validateRecurso(req.body));
    res.status(201).json(recurso);
  } catch (err) {
    next(err);
  }
};

export const getRecursos = async (req, res, next) => {
  try {
    const filters = {
      tipo: req.query.tipo,
      estado: req.query.estado,
      disponible: req.query.disponible,
      ...paging(req.query)
    };

    if (filters.disponible !== undefined) {
      if (!['true','false'].includes(filters.disponible)) fail('Filtro disponible inválido');
      filters.disponible = filters.disponible === 'true';
    }
    for (const key of ['tipo','estado']) if (filters[key] !== undefined && typeof filters[key] !== 'string') fail('Filtro inválido');

    const recursos = await Recurso.findAll(filters);
    res.json(recursos);
  } catch (err) {
    next(err);
  }
};

export const getRecursoById = async (req, res, next) => {
  try {
    const recurso = await Recurso.findById(id(req.params.id));

    if (!recurso) {
      return res.status(404).json({ message: 'Recurso no encontrado' });
    }

    res.json(recurso);
  } catch (err) {
    next(err);
  }
};

export const updateRecurso = async (req, res, next) => {
  try {
    const recursoId = id(req.params.id);
    const current = await Recurso.findById(recursoId);
    if (!current || current.eliminado_en) return res.status(404).json({ error: 'Recurso no encontrado' });
    const recurso = await Recurso.update(recursoId, validateRecurso(req.body, true, current));

    if (!recurso) {
      return res.status(404).json({ message: 'Recurso no encontrado' });
    }

    res.json(recurso);
  } catch (err) {
    next(err);
  }
};

export const updateDisponibilidad = async (req, res, next) => {
  try {
    const { disponible } = req.body || {};

    if (typeof disponible !== 'boolean') {
      return res.status(400).json({ message: 'disponible debe ser un valor booleano' });
    }

    const recursoId = id(req.params.id);
    const current = await Recurso.findById(recursoId);
    if (!current || current.eliminado_en) return res.status(404).json({ error: 'Recurso no encontrado' });
    if (disponible && current.estado !== 'disponible') fail('El recurso no está operativo');
    const recurso = await Recurso.updateAvailability(recursoId, disponible);

    if (!recurso) {
      return res.status(404).json({ message: 'Recurso no encontrado' });
    }

    res.json(recurso);
  } catch (err) {
    next(err);
  }
};

export const deleteRecurso = async (req, res, next) => {
  try {
    if (!await Recurso.softDelete(id(req.params.id))) return res.status(404).json({ error: 'Recurso no encontrado' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getTipos = async (req, res, next) => {
  try {
    const tipos = await Recurso.findUniqueTypes();
    res.json(tipos);
  } catch (err) {
    next(err);
  }
};

export const countRecursosDisponibles = async (req, res, next) => {
  try {
    const count = await Recurso.countAvailable();
    res.json({ count });
  } catch (err) {
    next(err);
  }
};
