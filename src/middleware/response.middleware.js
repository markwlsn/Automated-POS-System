export function responseMiddleware(req, res, next) {
  res.success = (data, statusCode = 200) => {
    return res.status(statusCode).json({ data })
  }

  res.fail = (message, code = 'BAD_REQUEST', statusCode = 400, details = {}) => {
    return res.status(statusCode).json({
      error: {
        message,
        code,
        details,
      },
    })
  }

  next()
}
