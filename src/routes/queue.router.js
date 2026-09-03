import { Router } from 'express'
import { issueTicket, getQueue, updateTicketStatus } from '../controllers/queue.controller.js'
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js'
import { validateBody } from '../middleware/validate.middleware.js'
import { ROLES } from '../config/constants.js'
import { issueTicketSchema, updateTicketStatusSchema } from './schemas.js'

export const queueRouter = Router()

// Publicly accessible ticket creation & queue display
queueRouter.post('/queue/tickets', validateBody(issueTicketSchema), issueTicket)
queueRouter.get('/queue', getQueue)

// Staff/Owner management of queue status
queueRouter.patch(
  '/queue/tickets/:id/status',
  authenticateToken,
  requireRole([ROLES.OWNER, ROLES.STAFF]),
  validateBody(updateTicketStatusSchema),
  updateTicketStatus
)
