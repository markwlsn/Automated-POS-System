import { Router } from 'express'
import {
  getCategories,
  getProducts,
  getProductById,
  createProduct,
} from '../controllers/product.controller.js'
import { validateBody } from '../middleware/validate.middleware.js'
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js'
import { ROLES } from '../config/constants.js'
import { createProductSchema } from './schemas.js'

export const productRouter = Router()

productRouter.get('/categories', getCategories)
productRouter.get('/products', getProducts)
productRouter.get('/products/:id', getProductById)
productRouter.post(
  '/products',
  authenticateToken,
  requireRole([ROLES.OWNER]),
  validateBody(createProductSchema),
  createProduct
)
