import cors from 'cors'
import express from 'express'
import { authRouter } from './modules/auth/auth.routes.js'
import {
  eventRegistrationRouter,
  registrationRouter,
} from './modules/registrations/registration.routes.js'
import { errorMiddleware } from './shared/middleware/error.middleware.js'

export const createApp = () => {
  const app = express()

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }))
  app.use(express.json())

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok', service: 'eventpass-api' })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/registrations', registrationRouter)
  app.use('/api/events', eventRegistrationRouter)

  app.use((_request, response) => {
    response.status(404).json({ message: 'Route not found' })
  })
  app.use(errorMiddleware)

  return app
}