export function errorHandler(err, req, res, next) {
  const status = err.code === 'ER_DUP_ENTRY' ? 409 : err.status || err.statusCode || 500;
  if (status >= 500) console.error(`[users-service] ${req.method}: ${err.code || err.name || 'ERROR'}`);

  res.status(status).json({
    error: err.code === 'ER_DUP_ENTRY' ? 'El registro ya existe' : status >= 500 ? 'Error interno del servidor' : err.message
  });
}

export function notFound(req, res, next) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.originalUrl}` });
}
