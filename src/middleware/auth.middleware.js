import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      error: {
        message: 'Authentication token required',
        code: 'UNAUTHORIZED',
        details: {},
      },
    })
  }

  jwt.verify(token, env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired token',
          code: 'UNAUTHORIZED',
          details: {},
        },
      })
    }
    req.user = user
    next()
  })
}

export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
          details: {},
        },
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
          code: 'FORBIDDEN',
          details: {
            requiredRoles: allowedRoles,
            currentRole: req.user.role,
          },
        },
      })
    }

    next()
  }
}
