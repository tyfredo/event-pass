import cors from 'cors'
import express from 'express'
import { authRouter } from './modules/auth/auth.routes.js'
import { eventsRouter } from './modules/events/events.routes.js'
import {
  eventRegistrationRouter,
  registrationRouter,
} from './modules/registrations/registration.routes.js'
import { AppError } from './shared/errors.js'
import { errorMiddleware } from './shared/middleware/error.middleware.js'
import { errorHandler } from './shared/middleware/errorHandler.js'

export const createApp = () => {
  const app = express()

  app.disable('x-powered-by')

  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())

  app.use(cors({ origin: allowedOrigins }))
  app.use(express.json({ limit: '100kb' }))

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok', service: 'eventpass-api' })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/registrations', registrationRouter)
  app.use('/api/events', eventsRouter)
  app.use('/api/events', eventRegistrationRouter)

  app.use((req, _res, next) => {
    next(AppError.notFound(`La ruta ${req.method} ${req.originalUrl} no existe.`))
  })

  app.use(errorHandler)
  app.use(errorMiddleware)

  return app
}

export const app = createApp();