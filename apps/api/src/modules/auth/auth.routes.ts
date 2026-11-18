import { Router } from 'express'
import { me, register } from './auth.controller.js'
import { requireAuth } from '../../shared/middleware/auth.js'

export const authRouter = Router();
authRouter.post('/register', register)
authRouter.get('/me', requireAuth, me)
