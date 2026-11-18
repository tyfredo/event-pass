import { Router } from 'express'
import { authRouter } from '../modules/auth/auth.routes.js'

export const ApiRouter = Router()
ApiRouter.use('/auth', authRouter)
