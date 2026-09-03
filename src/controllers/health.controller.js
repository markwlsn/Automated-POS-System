import { env } from '../config/env.js'

export function getHealth(req, res) {
  return res.success({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  })
}
