export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  const status = error.status || 500;
  const body = { success: false, message: error.message || 'Internal server error' };
  if (error.field) body.field = error.field;
  res.status(status).json(body);
}
