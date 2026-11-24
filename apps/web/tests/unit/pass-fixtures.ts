import type { EventItem } from '~/types/events'
import type { Pass } from '~/types/pass'
import type { Registration } from '~/types/registration'

export const examplePass: Pass = {
  id: 'evt-abierto_ana',
  folio: 'EVT-SEED01',
  status: 'active',
  eventId: 'evt-abierto',
  eventTitle: 'Congreso de Cómputo en la Nube',
  eventStartsAt: '2026-12-05T17:00:00.000Z',
  eventLocation: 'Auditorio A',
  attendeeName: 'Ana Asistente',
}

export const cancelledExamplePass: Pass = { ...examplePass, status: 'cancelled' }

export const exampleEvent: EventItem = {
  id: 'evt-abierto',
  organizerId: 'org-1',
  title: 'Congreso de Cómputo en la Nube',
  description: 'Charlas y talleres.',
  location: 'Auditorio A',
  capacity: 100,
  registeredCount: 2,
  availableSeats: 98,
  status: 'open',
  startsAt: '2026-12-05T17:00:00.000Z',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
}

export const exampleRegistration: Registration = {
  id: 'evt-abierto_att-1',
  eventId: 'evt-abierto',
  attendeeId: 'att-1',
  attendeeName: 'Ana Asistente',
  attendeeEmail: 'ana@eventpass.test',
  eventTitle: 'Congreso de Cómputo en la Nube',
  folio: 'EVP-2026-A1B2C3',
  status: 'active',
  createdAt: '2026-11-20T10:00:00.000Z',
}