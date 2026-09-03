import { Router } from 'express'
import { signUp, signIn, getMe } from '../controllers/auth.controller.js'
import { validateBody } from '../middleware/validate.middleware.js'
import { authenticateToken } from '../middleware/auth.middleware.js'
import { signupSchema, loginSchema } from './schemas.js'

export const authRouter = Router()

authRouter.post('/signup', validateBody(signupSchema), signUp)
authRouter.post('/login', validateBody(loginSchema), signIn)
authRouter.get('/me', authenticateToken, getMe)
