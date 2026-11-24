import { Router } from 'express'
import { requireAuth, requireRole } from '../../shared/middleware/auth.js'
import {
  cancelRegistration,
  createRegistration,
  getPass,
  listEventRegistrations,
  listMyRegistrations,
} from './registration.controller.js'

// /api/registrations
export const registrationRouter = Router()

registrationRouter.use(requireAuth, requireRole('attendee'))
registrationRouter.post('/', createRegistration)
registrationRouter.get('/me', listMyRegistrations)
registrationRouter.get('/:id', getPass)
registrationRouter.patch('/:id/cancel', cancelRegistration)

// /api/events/:id/registrations
export const eventRegistrationRouter = Router()

eventRegistrationRouter.get(
  '/:id/registrations',
  requireAuth,
  requireRole('organizer'),
  listEventRegistrations,
)
