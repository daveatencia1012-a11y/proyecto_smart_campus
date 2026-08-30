import Recurso from '../models/Recurso.js';
import { authenticate, authorize } from '../middleware/auth.js';

export const createRecurso = async (req, res, next) => {
  try {
    const recurso = await Recurso.create(req.body);
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
      disponible: req.query.disponible
    };

    if (filters.disponible !== undefined) {
      filters.disponible = filters.disponible === 'true';
    }

    const recursos = await Recurso.findAll(filters);
    res.json(recursos);
  } catch (err) {
    next(err);
  }
};

export const getRecursoById = async (req, res, next) => {
  try {
    const recurso = await Recurso.findById(req.params.id);

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
    const recurso = await Recurso.update(req.params.id, req.body);

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
    const { disponible } = req.body;

    if (typeof disponible !== 'boolean') {
      return res.status(400).json({ message: 'disponible debe ser un valor booleano' });
    }

    const recurso = await Recurso.updateAvailability(req.params.id, disponible);

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
    await Recurso.softDelete(req.params.id);
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
