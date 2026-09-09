export function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] Error en ${req.method} ${req.originalUrl}:`, err);

  const status = err.status || 500;

  res.status(status).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

export function notFound(req, res, next) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.originalUrl}` });
}
