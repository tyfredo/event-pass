import { Router } from 'express'
import { requireAuth } from '../../shared/middleware/auth.middleware.js'
import { requireRole } from '../../shared/middleware/role.middleware.js'
import {
  createRegistration,
  listEventRegistrations,
  listMyRegistrations,
} from './registration.controller.js'

// /api/registrations
export const registrationRouter = Router()

registrationRouter.use(requireAuth, requireRole('attendee'))
registrationRouter.post('/', createRegistration)
registrationRouter.get('/me', listMyRegistrations)

// /api/events/:id/registrations
export const eventRegistrationRouter = Router()

eventRegistrationRouter.get(
  '/:id/registrations',
  requireAuth,
  requireRole('organizer'),
  listEventRegistrations,
)
