/**
 * Global error handling middleware for Express
 */

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Temporal connection errors
  if (err.message?.includes('UNAVAILABLE') || err.message?.includes('connect')) {
    return res.status(503).json({
      success: false,
      error: 'Temporal server unavailable. Is it running on localhost:7233?',
      hint: 'Run: docker-compose up -d',
    });
  }

  // PostgreSQL errors
  if (err.code === '23505') {
    return res.status(409).json({ success: false, error: 'Duplicate entry — email already exists' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, error: 'Referenced record not found' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
}

module.exports = { errorHandler, notFoundHandler };
