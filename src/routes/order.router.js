import { Router } from 'express'
import { createOrder, getOrders, getOrderById } from '../controllers/order.controller.js'
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js'
import { validateBody } from '../middleware/validate.middleware.js'
import { ROLES } from '../config/constants.js'
import { createOrderSchema } from './schemas.js'

export const orderRouter = Router()

orderRouter.post(
  '/orders',
  authenticateToken,
  requireRole([ROLES.OWNER, ROLES.STAFF]),
  validateBody(createOrderSchema),
  createOrder
)

orderRouter.get(
  '/orders',
  authenticateToken,
  requireRole([ROLES.OWNER, ROLES.STAFF]),
  getOrders
)

orderRouter.get(
  '/orders/:id',
  authenticateToken,
  requireRole([ROLES.OWNER, ROLES.STAFF]),
  getOrderById
)
