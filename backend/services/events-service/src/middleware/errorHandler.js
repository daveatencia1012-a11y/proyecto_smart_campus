const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  if (statusCode >= 500) console.error(`[events-service] ${err.code || err.name || 'ERROR'}`);
  const message = statusCode >= 500 ? 'Error interno del servidor' : err.message;

  res.status(statusCode).json({
    error: message
  });
};

export default errorHandler;
