import { Router } from 'express'
import { getInventory, updateStock } from '../controllers/inventory.controller.js'
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js'
import { validateBody } from '../middleware/validate.middleware.js'
import { ROLES } from '../config/constants.js'
import { updateStockSchema } from './schemas.js'

export const inventoryRouter = Router()

inventoryRouter.get(
  '/inventory',
  authenticateToken,
  requireRole([ROLES.OWNER, ROLES.STAFF]),
  getInventory
)

inventoryRouter.patch(
  '/inventory/:productId',
  authenticateToken,
  requireRole([ROLES.OWNER, ROLES.STAFF]),
  validateBody(updateStockSchema),
  updateStock
)
