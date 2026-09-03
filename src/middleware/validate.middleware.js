export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const issue = result.error.issues[0]
      return res.status(400).json({
        error: {
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Validation error',
          code: 'VALIDATION_ERROR',
          details: result.error.format(),
        },
      })
    }
    req.body = result.data
    next()
  }
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      const issue = result.error.issues[0]
      return res.status(400).json({
        error: {
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: result.error.format(),
        },
      })
    }
    req.query = result.data
    next()
  }
}
