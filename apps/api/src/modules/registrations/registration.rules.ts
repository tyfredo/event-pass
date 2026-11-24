import { randomBytes } from 'node:crypto'
import type { EventForRegistration, RegistrationStatus } from './registration.types.js'
import { AppError } from '../../shared/errors.js'

export const checkCanRegister = (
  event: EventForRegistration | null,
  alreadyRegistered: boolean,
) => {
  if (!event) throw new Error('EVENT_NOT_FOUND')
  if (event.status === 'closed') throw new Error('EVENT_CLOSED')
  if (alreadyRegistered) throw new Error('ALREADY_REGISTERED')
  if (event.registeredCount >= event.capacity) throw new Error('EVENT_FULL')
}


export const generateFolio = () => {
  const code = randomBytes(3).toString('hex').toUpperCase()
  return `EVP-${new Date().getFullYear()}-${code}`
}

export function assertOwner(registration: { attendeeId: string }, uid: string) {
  if (registration.attendeeId !== uid) {
    throw AppError.forbidden('Esta inscripción no te pertenece', 'NOT_REGISTRATION_OWNER')
  }
}

export function checkCanCancel(
  registration: { attendeeId: string; status: RegistrationStatus } | null,
  uid: string,
) {
  if (!registration) {
    throw new AppError(404, 'REGISTRATION_NOT_FOUND', 'La inscripción no existe')
  }
  assertOwner(registration, uid)
  if (registration.status === 'cancelled') {
    throw new AppError(409, 'ALREADY_CANCELLED', 'La inscripción ya estaba cancelada')
  }
}
