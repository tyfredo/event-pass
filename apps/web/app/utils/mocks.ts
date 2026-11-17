import type {
  ApiRequestOptions,
  RegisterPayload,
  Role,
  UserProfile,
} from '~/types'
import type { EventItem, EventStatus } from '~/types/events'
import type { Registration } from '~/types/registration'
import { ApiRequestError } from '~/utils/apiErrors'

const MOCK_TOKEN_PREFIX = 'mock-token-'
const MOCK_ORGANIZER_CODE = 'ORG-2026'
const MOCK_DELAY_MS = 250

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

const users: UserProfile[] = [
  { uid: 'org-ana', name: 'Ana Gómez', email: 'org.ana@eventpass.test', role: 'organizer', createdAt: daysFromNow(-30) },
  { uid: 'org-carlos', name: 'Carlos Ruiz', email: 'org.carlos@eventpass.test', role: 'organizer', createdAt: daysFromNow(-25) },
  { uid: 'att-laura', name: 'Laura Pérez', email: 'laura@eventpass.test', role: 'attendee', createdAt: daysFromNow(-20) },
  { uid: 'att-diego', name: 'Diego Torres', email: 'diego@eventpass.test', role: 'attendee', createdAt: daysFromNow(-18) },
  { uid: 'att-sofia', name: 'Sofía Herrera', email: 'sofia@eventpass.test', role: 'attendee', createdAt: daysFromNow(-15) },
]

const events: EventItem[] = [
  {
    id: 'evt-vue',
    organizerId: 'org-ana',
    title: 'Taller de Vue y Nuxt',
    description: 'Construye una aplicación completa con Nuxt 4.',
    location: 'Auditorio A',
    capacity: 40,
    registeredCount: 1,
    availableSeats: 39,
    status: 'open',
    startsAt: daysFromNow(10),
    createdAt: daysFromNow(-10),
    updatedAt: daysFromNow(-10),
  },
  {
    id: 'evt-firebase',
    organizerId: 'org-ana',
    title: 'Introducción a Firebase',
    description: 'Autenticación y Firestore desde cero.',
    location: 'Sala 3',
    capacity: 2,
    registeredCount: 1,
    availableSeats: 1,
    status: 'open',
    startsAt: daysFromNow(5),
    createdAt: daysFromNow(-8),
    updatedAt: daysFromNow(-8),
  },
  {
    id: 'evt-docker',
    organizerId: 'org-carlos',
    title: 'Docker para desarrolladores',
    description: 'Contenedores, imágenes y compose.',
    location: 'Laboratorio 2',
    capacity: 25,
    registeredCount: 0,
    availableSeats: 25,
    status: 'closed',
    startsAt: daysFromNow(15),
    createdAt: daysFromNow(-6),
    updatedAt: daysFromNow(-2),
  },
]

const registrations: Registration[] = [
  {
    id: 'evt-vue_att-laura',
    eventId: 'evt-vue',
    attendeeId: 'att-laura',
    attendeeName: 'Laura Pérez',
    attendeeEmail: 'laura@eventpass.test',
    eventTitle: 'Taller de Vue y Nuxt',
    folio: 'EVP-2026-A1B2C3',
    status: 'active',
    createdAt: daysFromNow(-3),
  },
  {
    id: 'evt-firebase_att-diego',
    eventId: 'evt-firebase',
    attendeeId: 'att-diego',
    attendeeName: 'Diego Torres',
    attendeeEmail: 'diego@eventpass.test',
    eventTitle: 'Introducción a Firebase',
    folio: 'EVP-2026-D4E5F6',
    status: 'active',
    createdAt: daysFromNow(-2),
  },
]

export function mockTokenFor(uid: string) {
  return `${MOCK_TOKEN_PREFIX}${uid}`
}

export function findMockUserByEmail(email: string) {
  return users.find((user) => user.email === email.trim().toLowerCase()) ?? null
}

export function findMockUserByUid(uid: string) {
  return users.find((user) => user.uid === uid) ?? null
}

function userFromToken(token: string | null) {
  if (!token?.startsWith(MOCK_TOKEN_PREFIX)) {
    return null
  }
  return findMockUserByUid(token.slice(MOCK_TOKEN_PREFIX.length))
}

function requireUser(token: string | null, ...roles: Role[]) {
  const user = userFromToken(token)
  if (!user) {
    throw new ApiRequestError(401, 'Unauthorized')
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    throw new ApiRequestError(403, 'Forbidden')
  }
  return user
}

function findEvent(id: string) {
  const event = events.find((item) => item.id === id)
  if (!event) {
    throw new ApiRequestError(404, 'EVENT_NOT_FOUND')
  }
  return event
}

function requireOwnEvent(id: string, organizerId: string) {
  const event = findEvent(id)
  if (event.organizerId !== organizerId) {
    throw new ApiRequestError(403, 'NOT_EVENT_OWNER')
  }
  return event
}

function refreshSeats(event: EventItem) {
  event.availableSeats = Math.max(event.capacity - event.registeredCount, 0)
  event.updatedAt = new Date().toISOString()
}

function generateFolio() {
  const alphabet = 'ABCDEF0123456789'
  let folio = ''
  do {
    const code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
    folio = `EVP-${new Date().getFullYear()}-${code}`
  } while (registrations.some((registration) => registration.folio === folio))
  return folio
}

function registerUser(body: Partial<RegisterPayload>) {
  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const role = body.role

  if (name.length < 2 || !email.includes('@') || password.length < 6 || (role !== 'attendee' && role !== 'organizer')) {
    throw new ApiRequestError(400, 'VALIDATION_ERROR')
  }
  if (role === 'organizer' && body.organizerCode !== MOCK_ORGANIZER_CODE) {
    throw new ApiRequestError(403, 'INVALID_ORGANIZER_CODE')
  }
  if (findMockUserByEmail(email)) {
    throw new ApiRequestError(409, 'EMAIL_TAKEN')
  }

  const profile: UserProfile = {
    uid: `mock-${role}-${Date.now()}`,
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  }
  users.push(profile)
  return profile
}

function createEvent(organizerId: string, body: Record<string, unknown>) {
  const capacity = Number(body.capacity)
  const startsAt = String(body.startsAt ?? '')
  const title = String(body.title ?? '').trim()

  if (!title || !Number.isInteger(capacity) || capacity <= 0 || !(new Date(startsAt).getTime() > Date.now())) {
    throw new ApiRequestError(400, 'VALIDATION_ERROR')
  }

  const now = new Date().toISOString()
  const event: EventItem = {
    id: `evt-${Date.now()}`,
    organizerId,
    title,
    description: String(body.description ?? ''),
    location: String(body.location ?? ''),
    capacity,
    registeredCount: 0,
    availableSeats: capacity,
    status: 'open',
    startsAt: new Date(startsAt).toISOString(),
    createdAt: now,
    updatedAt: now,
  }
  events.push(event)
  return event
}

function updateEvent(event: EventItem, body: Record<string, unknown>) {
  if (body.capacity !== undefined) {
    const capacity = Number(body.capacity)
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new ApiRequestError(400, 'VALIDATION_ERROR')
    }
    if (capacity < event.registeredCount) {
      throw new ApiRequestError(409, 'CAPACITY_BELOW_REGISTERED')
    }
    event.capacity = capacity
  }
  if (body.startsAt !== undefined) {
    const startsAt = new Date(String(body.startsAt))
    if (!(startsAt.getTime() > Date.now())) {
      throw new ApiRequestError(400, 'VALIDATION_ERROR')
    }
    event.startsAt = startsAt.toISOString()
  }
  if (typeof body.title === 'string') event.title = body.title.trim()
  if (typeof body.description === 'string') event.description = body.description
  if (typeof body.location === 'string') event.location = body.location
  refreshSeats(event)
  return event
}

function createRegistration(user: UserProfile, eventId: string) {
  const event = findEvent(eventId)
  if (event.status === 'closed') {
    throw new ApiRequestError(409, 'EVENT_CLOSED')
  }
  const alreadyRegistered = registrations.some(
    (registration) =>
      registration.eventId === eventId && registration.attendeeId === user.uid && registration.status === 'active',
  )
  if (alreadyRegistered) {
    throw new ApiRequestError(409, 'ALREADY_REGISTERED')
  }
  if (event.registeredCount >= event.capacity) {
    throw new ApiRequestError(409, 'EVENT_FULL')
  }

  const registration: Registration = {
    id: `${eventId}_${user.uid}_${Date.now()}`,
    eventId,
    attendeeId: user.uid,
    attendeeName: user.name,
    attendeeEmail: user.email,
    eventTitle: event.title,
    folio: generateFolio(),
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  registrations.push(registration)
  event.registeredCount += 1
  refreshSeats(event)
  return registration
}

function cancelRegistration(user: UserProfile, registrationId: string) {
  const registration = registrations.find((item) => item.id === registrationId)
  if (!registration) {
    throw new ApiRequestError(404, 'REGISTRATION_NOT_FOUND')
  }
  if (registration.attendeeId !== user.uid) {
    throw new ApiRequestError(403, 'NOT_REGISTRATION_OWNER')
  }
  if (registration.status === 'active') {
    registration.status = 'cancelled'
    const event = events.find((item) => item.id === registration.eventId)
    if (event) {
      event.registeredCount = Math.max(event.registeredCount - 1, 0)
      refreshSeats(event)
    }
  }
  return registration
}

function byDate<T extends { startsAt?: string; createdAt: string }>(a: T, b: T) {
  return (a.startsAt ?? a.createdAt).localeCompare(b.startsAt ?? b.createdAt)
}

function resolve(path: string, method: string, options: ApiRequestOptions, token: string | null): unknown {
  const body = options.body ?? {}
  const segments = path.split('/').filter(Boolean)
  const [resource, id, action] = segments

  if (resource === 'auth') {
    if (method === 'POST' && id === 'register') return registerUser(body as Partial<RegisterPayload>)
    if (method === 'GET' && id === 'me') return requireUser(token)
  }

  if (resource === 'events') {
    if (method === 'GET' && !id) {
      const status = options.query?.status as EventStatus | undefined
      return events.filter((event) => !status || event.status === status).sort(byDate)
    }
    if (method === 'POST' && !id) {
      const user = requireUser(token, 'organizer')
      return createEvent(user.uid, body)
    }
    if (method === 'GET' && id === 'mine') {
      const user = requireUser(token, 'organizer')
      return events.filter((event) => event.organizerId === user.uid).sort(byDate)
    }
    if (method === 'GET' && id && !action) return findEvent(id)
    if (method === 'GET' && id && action === 'registrations') {
      const user = requireUser(token, 'organizer')
      requireOwnEvent(id, user.uid)
      return registrations.filter((registration) => registration.eventId === id).sort(byDate)
    }
    if (method === 'PATCH' && id && !action) {
      const user = requireUser(token, 'organizer')
      return updateEvent(requireOwnEvent(id, user.uid), body)
    }
    if (method === 'PATCH' && id && action === 'status') {
      const user = requireUser(token, 'organizer')
      const event = requireOwnEvent(id, user.uid)
      if (body.status !== 'open' && body.status !== 'closed') {
        throw new ApiRequestError(400, 'VALIDATION_ERROR')
      }
      event.status = body.status
      refreshSeats(event)
      return event
    }
  }

  if (resource === 'registrations') {
    if (method === 'POST' && !id) {
      const user = requireUser(token, 'attendee')
      return createRegistration(user, String(body.eventId ?? ''))
    }
    if (method === 'GET' && id === 'me') {
      const user = requireUser(token, 'attendee')
      return registrations.filter((registration) => registration.attendeeId === user.uid).sort(byDate).reverse()
    }
    if (method === 'PATCH' && id && action === 'cancel') {
      const user = requireUser(token, 'attendee')
      return cancelRegistration(user, id)
    }
  }

  throw new ApiRequestError(404, 'Route not found')
}

export async function mockRequest<T>(url: string, options: ApiRequestOptions, token: string | null): Promise<T> {
  await new Promise((done) => setTimeout(done, MOCK_DELAY_MS))
  const path = url.split('?')[0] ?? url
  const method = (options.method ?? 'GET').toUpperCase()
  const data = resolve(path, method, options, token)
  return structuredClone({ data }) as T
}
