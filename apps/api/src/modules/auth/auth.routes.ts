import { Router } from 'express'
import { me, register } from './auth.controller'
import { requireAuth } from '../../shared/middleware/auth'

export const authRouter = Router();
authRouter.post('/register', register)
authRouter.get('/me', requireAuth, me)
