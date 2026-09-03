import { Router } from 'express'
import { authRouter } from './auth.router.js'
import { productRouter } from './product.router.js'
import { inventoryRouter } from './inventory.router.js'
import { orderRouter } from './order.router.js'
import { queueRouter } from './queue.router.js'
import { reportRouter } from './report.router.js'

export const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/', productRouter)
apiRouter.use('/', inventoryRouter)
apiRouter.use('/', orderRouter)
apiRouter.use('/', queueRouter)
apiRouter.use('/', reportRouter)
