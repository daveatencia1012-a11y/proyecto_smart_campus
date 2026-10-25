export function errorHandler(err, req, res, next) {
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'El recurso ya existe' });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'Referencia inválida' });
  }

  const statusCode = err.statusCode || err.status || 500;
  if (statusCode >= 500) console.error(`[reservations-service] ${err.code || err.name || 'ERROR'}`);
  const message = statusCode >= 500 ? 'Error interno del servidor' : err.message;

  res.status(statusCode).json({
    error: message
  });
}
