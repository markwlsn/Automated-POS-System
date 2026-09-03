import { Router } from 'express'
import { getSummary } from '../controllers/report.controller.js'
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js'
import { ROLES } from '../config/constants.js'

export const reportRouter = Router()

reportRouter.get(
  '/reports/summary',
  authenticateToken,
  requireRole([ROLES.OWNER]),
  getSummary
)
