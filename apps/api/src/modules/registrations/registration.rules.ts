import { randomBytes } from 'node:crypto'
import type { EventForRegistration } from './registration.types.js'


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
