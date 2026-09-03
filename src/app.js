import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import { responseMiddleware } from './middleware/response.middleware.js'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'
import { getHealth } from './controllers/health.controller.js'
import { apiRouter } from './routes/api.router.js'

export function createApp() {
  const app = express()

  // Security headers
  app.use(helmet())

  // CORS configuration
  const allowedOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim())
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true)
        } else {
          callback(new Error('Blocked by CORS policy'))
        }
      },
      credentials: true,
    })
  )

  // Body parser
  app.use(express.json())

  // Standard response wrapper helper
  app.use(responseMiddleware)

  // Health endpoint
  app.get('/health', getHealth)

  // API v1 routes
  app.use('/api/v1', apiRouter)

  // 404 handler
  app.use(notFoundHandler)

  // Global error handler
  app.use(errorHandler)

  return app
}
