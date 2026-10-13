function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  console.error(error);
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large' });
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
