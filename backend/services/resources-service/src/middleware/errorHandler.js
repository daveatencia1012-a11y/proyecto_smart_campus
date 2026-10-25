export default (err, req, res, next) => {
  const status = err.code === 'ER_DUP_ENTRY' ? 409 : err.statusCode || err.status || 500;
  if (status >= 500) console.error(`[resources-service] ${err.code || err.name || 'ERROR'}`);
  const message = err.code === 'ER_DUP_ENTRY' ? 'El código ya existe' : status >= 500 ? 'Error interno del servidor' : err.message;

  res.status(status).json({
    error: message, message
  });
};
