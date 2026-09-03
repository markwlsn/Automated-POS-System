export function errorHandler(err, req, res, _next) {
  const statusCode = err.status || (err.code === 'RESOURCE_NOT_FOUND' ? 404 : err.code === 'CONFLICT' ? 409 : err.code === 'UNAUTHORIZED' ? 401 : err.code === 'FORBIDDEN' ? 403 : 400)
  const code = err.code || 'INTERNAL_ERROR'
  const message = err.message || 'An unexpected error occurred'
  const details = err.details || {}

  if (statusCode >= 500) {
    console.error('Unhandled server error:', err)
  }

  return res.status(statusCode).json({
    error: {
      message,
      code,
      details,
    },
  })
}

export function notFoundHandler(req, res) {
  return res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
      code: 'RESOURCE_NOT_FOUND',
      details: {},
    },
  })
}
