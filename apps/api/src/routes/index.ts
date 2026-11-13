import { Router } from 'express'
import { authRouter } from '../modules/auth/auth.routes'

export const ApiRouter = Router()
ApiRouter.use('/auth', authRouter)
